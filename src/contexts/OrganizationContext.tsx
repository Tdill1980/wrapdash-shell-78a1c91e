import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface OrganizationBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_name?: string;
  tagline?: string;
}

interface OrganizationSettings {
  name: string;
  subdomain: string;
  branding: OrganizationBranding;
  subscriptionTier: "free" | "pro" | "enterprise";
  affiliateFounderId?: string;
  offersInstallation: boolean;
}

interface OrganizationContextType {
  organizationId: string | null;
  subscriptionTier: "free" | "pro" | "enterprise";
  organizationSettings: OrganizationSettings;
  updateOrganization: (settings: Partial<OrganizationSettings>) => void;
  loading: boolean;
  user: User | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  // vinylvixen.wrapcommand.ai -> 'vinylvixen'
  // wrapcommand.ai or localhost -> 'main'
  // lovableproject.com (preview) -> 'main'
  if (
    hostname === 'localhost' || 
    parts.length <= 2 ||
    hostname.includes('lovableproject.com') ||
    hostname.includes('lovable.app')
  ) {
    return 'main';
  }
  return parts[0];
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro" | "enterprise">("pro");
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings>({
    name: "WrapCommand",
    subdomain: "main",
    branding: {},
    subscriptionTier: "pro",
    offersInstallation: true,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const subdomain = getSubdomain();
        let orgId: string | null = null;
        let orgData: any = null;

        // For unauthenticated users, use RPC to get org ID by subdomain
        if (!user) {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_organization_id_by_subdomain', { subdomain_param: subdomain });

          if (rpcError) {
            console.error('Error looking up organization by subdomain:', rpcError);
          }
          orgId = rpcData;
        } else {
          // For authenticated users, try membership first
          const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (memberError) {
            console.error('Error loading organization membership:', memberError);
          }

          if (memberData?.organization_id) {
            orgId = memberData.organization_id;
          } else {
            // Fall back to subdomain lookup via RPC
            const { data: rpcData } = await supabase
              .rpc('get_organization_id_by_subdomain', { subdomain_param: subdomain });
            orgId = rpcData;
          }

          // If we have an org ID, fetch the full org data (user must be member)
          if (orgId) {
            const { data, error } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', orgId)
              .maybeSingle();

            if (error) {
              console.error('Error loading organization:', error);
            }
            orgData = data;
          }
        }

        if (orgId) {
          setOrganizationId(orgId);
        }

        if (orgData) {
          setSubscriptionTier(orgData.subscription_tier as "free" | "pro" | "enterprise");
          setOrganizationSettings({
            name: orgData.name,
            subdomain: orgData.subdomain,
            branding: orgData.branding as OrganizationBranding,
            subscriptionTier: orgData.subscription_tier as "free" | "pro" | "enterprise",
            affiliateFounderId: orgData.affiliate_founder_id,
            offersInstallation: orgData.offers_installation ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [user]);

  const updateOrganization = async (settings: Partial<OrganizationSettings>) => {
    if (!organizationId) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: settings.name,
          branding: settings.branding as any,
        })
        .eq('id', organizationId);

      if (error) throw error;

      setOrganizationSettings((prev) => ({ ...prev, ...settings }));
    } catch (error) {
      console.error('Failed to update organization:', error);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizationId,
        subscriptionTier,
        organizationSettings,
        updateOrganization,
        loading,
        user,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};
