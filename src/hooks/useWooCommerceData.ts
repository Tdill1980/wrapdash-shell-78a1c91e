import { useState, useEffect } from "react";

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
        const wooUrl = import.meta.env.VITE_WOO_URL || 'https://weprintwraps.com';
        const consumerKey = import.meta.env.VITE_WOO_CONSUMER_KEY;
        const consumerSecret = import.meta.env.VITE_WOO_CONSUMER_SECRET;

        if (!consumerKey || !consumerSecret) {
          throw new Error("WooCommerce credentials not configured");
        }

        const url = `${wooUrl}/wp-json/wc/v3/orders?number=${orderNumber}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }

        const orders = await response.json();
        if (orders && orders.length > 0) {
          setWooData(orders[0]);
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
