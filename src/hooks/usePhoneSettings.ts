import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ConnectionMethod = "new_number" | "port_number" | "forward_calls";

export interface PhoneSettings {
  id: string;
  organization_id: string;
  twilio_phone_number: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  alert_phone_number: string;
  alert_email: string | null;
  company_name: string;
  ai_agent_name: string;
  greeting_message: string | null;
  phone_agent_enabled: boolean;
  sms_alerts_enabled: boolean;
  connection_method: ConnectionMethod | null;
  original_business_number: string | null;
  setup_completed: boolean;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhoneSettingsInput {
  twilio_phone_number?: string | null;
  twilio_account_sid?: string | null;
  twilio_auth_token?: string | null;
  alert_phone_number: string;
  alert_email?: string | null;
  company_name?: string;
  ai_agent_name?: string;
  greeting_message?: string | null;
  phone_agent_enabled?: boolean;
  sms_alerts_enabled?: boolean;
  connection_method?: ConnectionMethod;
  original_business_number?: string | null;
  setup_completed?: boolean;
}

export function usePhoneSettings(organizationId: string | null) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["phone-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from("organization_phone_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as PhoneSettings | null;
    },
    enabled: !!organizationId,
  });

  const createSettings = useMutation({
    mutationFn: async (input: PhoneSettingsInput) => {
      if (!organizationId) throw new Error("No organization ID");
      
      const { data, error } = await supabase
        .from("organization_phone_settings")
        .insert({
          organization_id: organizationId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-settings", organizationId] });
      toast.success("Phone settings created");
    },
    onError: (error) => {
      console.error("Error creating phone settings:", error);
      toast.error("Failed to create phone settings");
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (input: Partial<PhoneSettingsInput>) => {
      if (!organizationId) throw new Error("No organization ID");
      
      const { data, error } = await supabase
        .from("organization_phone_settings")
        .update(input)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-settings", organizationId] });
      toast.success("Phone settings updated");
    },
    onError: (error) => {
      console.error("Error updating phone settings:", error);
      toast.error("Failed to update phone settings");
    },
  });

  const saveSettings = async (input: PhoneSettingsInput) => {
    if (settings) {
      return updateSettings.mutateAsync(input);
    } else {
      return createSettings.mutateAsync(input);
    }
  };

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    isSaving: createSettings.isPending || updateSettings.isPending,
  };
}
