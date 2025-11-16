import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DesignVisualization = Tables<"color_visualizations">;

export const useDesignVault = (filters?: {
  tags?: string[];
  vehicleType?: string;
  finishType?: string;
  colorCategory?: string;
}) => {
  return useQuery({
    queryKey: ["design-vault", filters],
    queryFn: async () => {
      let query = supabase
        .from("color_visualizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains("tags", filters.tags);
      }

      if (filters?.vehicleType) {
        query = query.eq("vehicle_type", filters.vehicleType);
      }

      if (filters?.finishType) {
        query = query.eq("finish_type", filters.finishType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DesignVisualization[];
    },
  });
};
