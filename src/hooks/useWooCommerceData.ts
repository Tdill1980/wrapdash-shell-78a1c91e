import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    name: string;
    product_id: number;
    meta_data: Array<{
      key: string;
      value: any;
    }>;
  }>;
}

export const useWooCommerceData = (orderNumber: string) => {
  const [wooData, setWooData] = useState<WooCommerceOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    
    const fetchWooData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use edge function proxy instead of direct API call
        const { data, error: fnError } = await supabase.functions.invoke('woo-proxy', {
          body: { 
            action: 'getOrder',
            orderNumber: orderNumber 
          }
        });

        if (fnError) {
          throw new Error(fnError.message || "Failed to fetch order");
        }

        // Response is an array of orders
        if (data && Array.isArray(data) && data.length > 0) {
          setWooData(data[0]);
        } else if (data && !Array.isArray(data)) {
          // Single order response
          setWooData(data);
        } else {
          setError("Order not found in WooCommerce");
        }
      } catch (err: any) {
        console.error("Error fetching WooCommerce data:", err);
        setError(err.message || "Failed to fetch WooCommerce data");
      } finally {
        setLoading(false);
      }
    };

    fetchWooData();
  }, [orderNumber]);

  return { wooData, loading, error };
};
