import { MainLayout } from "@/layouts/MainLayout";
import { PhoneAgentSettings } from "@/components/settings/PhoneAgentSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Loader2 } from "lucide-react";

export default function PhoneSettings() {
  // Get user's organization
  const { data: organizationId, isLoading } = useQuery({
    queryKey: ["user-organization"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      return data?.organization_id ?? null;
    },
  });

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-amber-500" />
            Phone Agent Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your AI phone agent for automated call handling
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PhoneAgentSettings organizationId={organizationId} />
        )}
      </div>
    </MainLayout>
  );
}
