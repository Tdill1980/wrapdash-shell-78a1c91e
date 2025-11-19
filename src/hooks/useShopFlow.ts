import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { wooToInternalStatus, internalToCustomerStatus, type InternalStatus } from '@/lib/status-mapping';

export interface ShopFlowOrder {
  id: string;
  order_number: string;
  approveflow_project_id?: string;
  customer_name: string;
  customer_email?: string;
  product_type: string;
  status: string;
  priority?: string;
  estimated_completion_date?: string;
  assigned_to?: string;
  notes?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  created_at: string;
  updated_at: string;
  vehicle_info?: any;
  files?: any;
  timeline?: any;
  line_items?: any[];
  proof_url?: string;
}

export interface ShopFlowLog {
  id: string;
  order_id: string;
  event_type: string;
  payload?: any;
  created_at: string;
}

export const useShopFlow = (orderId?: string) => {
  const [orders, setOrders] = useState<ShopFlowOrder[]>([]);
  const [order, setOrder] = useState<ShopFlowOrder | null>(null);
  const [logs, setLogs] = useState<ShopFlowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    console.log('[ShopFlow] fetchOrders called');
    try {
      const { data, error } = await supabase
        .from('shopflow_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ShopFlow] fetchOrders error:', error);
        throw error;
      }
      
      console.log('[ShopFlow] fetchOrders success, orders:', data?.length || 0);
      setOrders(data || []);
    } catch (error: any) {
      console.error('[ShopFlow] fetchOrders catch:', error);
      toast({
        title: 'Error loading orders',
        description: error.message,
        variant: 'destructive',
      });
      setOrders([]); // Set empty array on error to prevent infinite loading
    }
  };

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('shopflow_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      toast({
        title: 'Error loading order',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchLogs = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('shopflow_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading logs:', error);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId || !order) return;

    try {
      const { error } = await supabase
        .from('shopflow_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Log status change
      await supabase
        .from('shopflow_logs')
        .insert({
          order_id: orderId,
          event_type: 'status_changed',
          payload: { 
            old_status: order.status,
            new_status: newStatus 
          },
        });

      // Update WooCommerce order meta
      try {
        const wooConsumerKey = import.meta.env.VITE_WOO_CONSUMER_KEY;
        const wooConsumerSecret = import.meta.env.VITE_WOO_CONSUMER_SECRET;
        
        if (wooConsumerKey && wooConsumerSecret) {
          await fetch(`https://weprintwraps.com/wp-json/wc/v3/orders/${order.order_number}`, {
            method: 'PUT',
            headers: {
              'Authorization': 'Basic ' + btoa(`${wooConsumerKey}:${wooConsumerSecret}`),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meta_data: [
                { key: '_shopflow_status', value: newStatus }
              ]
            })
          });
        }
      } catch (wooError) {
        console.error('Error updating WooCommerce:', wooError);
      }

      // Send Klaviyo event
      try {
        await supabase.functions.invoke('send-klaviyo-event', {
          body: {
            eventName: 'shopflow_status_changed',
            properties: {
              order_number: order.order_number,
              internal_status: newStatus,
              customer_name: order.customer_name,
              product_type: order.product_type
            },
            customerEmail: '' // Would need to get from order data
          }
        });
      } catch (klaviyoError) {
        console.error('Error sending Klaviyo event:', klaviyoError);
      }

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus}`,
      });

      fetchOrder();
      fetchLogs();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateOrderDetails = async (updates: Partial<ShopFlowOrder>) => {
    if (!orderId) return;

    try {
      const { error } = await supabase
        .from('shopflow_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Order Updated',
        description: 'Order details updated successfully',
      });

      fetchOrder();
    } catch (error: any) {
      toast({
        title: 'Error updating order',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addTracking = async (trackingNumber: string) => {
    if (!orderId) return;

    try {
      const trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
      const shippedAt = new Date().toISOString();

      const { error } = await supabase
        .from('shopflow_orders')
        .update({ 
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          shipped_at: shippedAt,
          status: 'Shipped'
        })
        .eq('id', orderId);

      if (error) throw error;

      await supabase
        .from('shopflow_logs')
        .insert({
          order_id: orderId,
          event_type: 'tracking_added',
          payload: { tracking_number: trackingNumber, tracking_url: trackingUrl },
        });

      // Trigger WooCommerce update and Klaviyo notification
      if (order?.order_number) {
        await supabase.functions.invoke('update-woo-order', {
          body: {
            orderNumber: order.order_number,
            metaData: [
              { key: '_tracking_number', value: trackingNumber },
              { key: '_tracking_url', value: trackingUrl }
            ],
            orderNote: `Package shipped with tracking: ${trackingNumber}`
          }
        });

        await supabase.functions.invoke('send-klaviyo-event', {
          body: {
            eventName: 'shopflow_tracking_added',
            customerEmail: order.customer_name,
            properties: {
              order_number: order.order_number,
              tracking_number: trackingNumber,
              tracking_url: trackingUrl,
              product_type: order.product_type
            }
          }
        });
      }

      toast({
        title: 'Tracking Added',
        description: `Tracking number ${trackingNumber} added successfully`,
      });

      fetchOrder();
      fetchLogs();
    } catch (error: any) {
      toast({
        title: 'Error adding tracking',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    console.log('[ShopFlow] useEffect triggered, orderId:', orderId);
    setLoading(true);
    
    if (orderId) {
      Promise.all([fetchOrder(), fetchLogs()]).finally(() => {
        console.log('[ShopFlow] Single order loaded, setting loading to false');
        setLoading(false);
      });

      const channel = supabase
        .channel(`shopflow-${orderId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopflow_orders', filter: `id=eq.${orderId}` }, () => {
          fetchOrder();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopflow_logs', filter: `order_id=eq.${orderId}` }, () => {
          fetchLogs();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      console.log('[ShopFlow] Fetching all orders...');
      fetchOrders().finally(() => {
        console.log('[ShopFlow] Orders loaded, setting loading to false');
        setLoading(false);
      });

      const channel = supabase
        .channel('shopflow-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopflow_orders' }, () => {
          console.log('[ShopFlow] Realtime update detected, refetching orders');
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  const syncFromWooCommerce = async (days: number = 7) => {
    try {
      setLoading(true);
      toast({
        title: 'Syncing Orders',
        description: 'Fetching recent orders from WooCommerce...',
      });

      const { data, error } = await supabase.functions.invoke('sync-woo-manual', {
        body: { target: 'shopflow', days }
      });

      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: `Synced ${data.syncedShopFlow} orders, skipped ${data.skipped} existing`,
      });

      // Refresh orders
      await fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    order,
    logs,
    loading,
    updateOrderStatus,
    updateOrderDetails,
    addTracking,
    syncFromWooCommerce,
    refetch: () => {
      if (orderId) {
        fetchOrder();
        fetchLogs();
      } else {
        fetchOrders();
      }
    },
  };
};
