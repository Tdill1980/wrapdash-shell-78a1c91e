// src/hooks/useAdVault.ts

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdVaultItem {
  id: string;
  organization_id: string;
  placement: string;
  type: "template" | "ai";
  png_url: string;
  template_id: string | null;
  layout_json: Record<string, unknown> | null;
  headline: string | null;
  primary_text: string | null;
  cta: string | null;
  created_at: string;
}

interface AdVaultInsert {
  organization_id: string;
  placement: string;
  type: string;
  png_url: string;
  template_id?: string | null;
  layout_json?: unknown;
  headline?: string | null;
  primary_text?: string | null;
  cta?: string | null;
}

export function useAdVault(organizationId?: string) {
  const queryClient = useQueryClient();

  const { data: ads, isLoading, error, refetch } = useQuery({
    queryKey: ["ad-vault", organizationId],
    queryFn: async (): Promise<AdVaultItem[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("ad_vault")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AdVaultItem[];
    },
    enabled: !!organizationId,
  });

  const addMutation = useMutation({
    mutationFn: async (item: AdVaultInsert) => {
      const insertData = {
        organization_id: item.organization_id,
        placement: item.placement,
        type: item.type,
        png_url: item.png_url,
        template_id: item.template_id || null,
        layout_json: item.layout_json as Record<string, unknown> | null,
        headline: item.headline || null,
        primary_text: item.primary_text || null,
        cta: item.cta || null,
      };

      const { data, error } = await supabase
        .from("ad_vault")
        .insert([insertData] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-vault", organizationId] });
      toast.success("Ad saved to vault!");
    },
    onError: (err) => {
      console.error("Add to vault error:", err);
      toast.error("Failed to save ad to vault");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ad_vault")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-vault", organizationId] });
      toast.success("Ad removed from vault");
    },
    onError: (err) => {
      console.error("Delete from vault error:", err);
      toast.error("Failed to remove ad");
    },
  });

  const addToVault = useCallback(
    (item: AdVaultInsert) => {
      return addMutation.mutateAsync(item);
    },
    [addMutation]
  );

  const removeFromVault = useCallback(
    (id: string) => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  return {
    ads: ads || [],
    isLoading,
    error,
    refetch,
    addToVault,
    removeFromVault,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
