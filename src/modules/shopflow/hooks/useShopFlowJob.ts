import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopFlowJob } from "./useShopFlowList";

export function useShopFlowJob(jobId: string | undefined) {
  const [job, setJob] = useState<ShopFlowJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shopflow_orders")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (error) throw error;
      setJob(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching job:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (newStatus: string) => {
    if (!jobId) return;

    try {
      const { error } = await supabase
        .from("shopflow_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;
      await fetchJob();
    } catch (err: any) {
      console.error("Error updating status:", err);
      throw err;
    }
  };

  const updateJobNotes = async (notes: string) => {
    if (!jobId) return;

    try {
      const { error } = await supabase
        .from("shopflow_orders")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;
      await fetchJob();
    } catch (err: any) {
      console.error("Error updating notes:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchJob();

    if (!jobId) return;

    const channel = supabase
      .channel(`shopflow_order_${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopflow_orders",
          filter: `id=eq.${jobId}`,
        },
        () => {
          fetchJob();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, loading, error, updateJobStatus, updateJobNotes, refetch: fetchJob };
}
