import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShopFlowJob {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  product_type: string;
  status: string;
  customer_stage: string | null;
  priority: string | null;
  assigned_to: string | null;
  vehicle_info: any;
  files: any;
  notes: string | null;
  preflight_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  estimated_completion_date: string | null;
  created_at: string;
  updated_at: string;
  approveflow_project_id: string | null;
}

export function useShopFlowList() {
  const [jobs, setJobs] = useState<ShopFlowJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shopflow_orders")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const channel = supabase
      .channel("shopflow_orders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopflow_orders",
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { jobs, loading, error, refetch: fetchJobs };
}
