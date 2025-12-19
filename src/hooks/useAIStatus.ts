import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AIStatusMode = "live" | "manual" | "off";

export function useAIStatus() {
  const [mode, setMode] = useState<AIStatusMode>("off");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_status_settings")
        .select("mode")
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching AI status:", error);
        return;
      }

      if (data) {
        setMode(data.mode as AIStatusMode);
      }
    } catch (err) {
      console.error("Failed to fetch AI status:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newMode: AIStatusMode) => {
    setUpdating(true);
    try {
      const { data: existing } = await supabase
        .from("ai_status_settings")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("ai_status_settings")
          .update({ mode: newMode, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_status_settings")
          .insert({ mode: newMode });

        if (error) throw error;
      }

      setMode(newMode);
      
      const modeLabels = {
        live: "LIVE - AI responds automatically",
        manual: "MANUAL - AI drafts for approval",
        off: "OFF - No AI responses"
      };
      
      toast({
        title: "AI Status Updated",
        description: modeLabels[newMode],
      });
    } catch (err) {
      console.error("Failed to update AI status:", err);
      toast({
        title: "Error",
        description: "Failed to update AI status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { mode, loading, updating, updateStatus };
}
