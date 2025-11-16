import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WrapBoxKit {
  id: string;
  design_vault_id: string | null;
  organization_id: string | null;
  vehicle_json: {
    make: string;
    model: string;
    year?: number;
    type: string;
  };
  panels: Array<{
    name: string;
    url: string;
    dpi: number;
    hasBleed: boolean;
  }>;
  tags: string[];
  status: "Draft" | "Ready" | "Exported";
  created_at: string;
  updated_at: string;
}

export const useWrapBoxKits = () => {
  return useQuery({
    queryKey: ["wrapbox-kits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wrapbox_kits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WrapBoxKit[];
    },
  });
};

export const useWrapBoxKit = (kitId: string) => {
  return useQuery({
    queryKey: ["wrapbox-kit", kitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wrapbox_kits")
        .select("*")
        .eq("id", kitId)
        .single();

      if (error) throw error;
      return data as WrapBoxKit;
    },
  });
};

export const useUpdateKitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kitId,
      status,
    }: {
      kitId: string;
      status: "Draft" | "Ready" | "Exported";
    }) => {
      const { error } = await supabase
        .from("wrapbox_kits")
        .update({ status })
        .eq("id", kitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wrapbox-kits"] });
    },
  });
};
