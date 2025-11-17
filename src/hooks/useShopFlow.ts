import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShopFlowOrder {
  id: string;
  order_number: string;
  approveflow_project_id?: string;
  customer_name: string;
  product_type: string;
  status: string;
  priority?: string;
  estimated_completion_date?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
    try {
      const { data, error } = await supabase
        .from('shopflow_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading orders',
        description: error.message,
        variant: 'destructive',
      });
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
    if (!orderId) return;

    try {
      const { error } = await supabase
        .from('shopflow_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await supabase
        .from('shopflow_logs')
        .insert({
          order_id: orderId,
          event_type: 'status_changed',
          payload: { new_status: newStatus },
        });

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

  useEffect(() => {
    setLoading(true);
    if (orderId) {
      Promise.all([fetchOrder(), fetchLogs()]).finally(() => setLoading(false));

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
      fetchOrders().finally(() => setLoading(false));

      const channel = supabase
        .channel('shopflow-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopflow_orders' }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  return {
    orders,
    order,
    logs,
    loading,
    updateOrderStatus,
    updateOrderDetails,
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
