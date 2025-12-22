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
        
        // First try by subdomain
        let { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('subdomain', subdomain)
          .maybeSingle();

        if (error) {
          console.error('Error loading organization by subdomain:', error);
        }

        // If no org found by subdomain and user is logged in, try by membership
        if (!data && user) {
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
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', memberData.organization_id)
              .maybeSingle();

            if (orgError) {
              console.error('Error loading organization by id:', orgError);
            }
            data = orgData;
          }
        }

        if (data) {
          setOrganizationId(data.id);
          setSubscriptionTier(data.subscription_tier as "free" | "pro" | "enterprise");
          setOrganizationSettings({
            name: data.name,
            subdomain: data.subdomain,
            branding: data.branding as OrganizationBranding,
            subscriptionTier: data.subscription_tier as "free" | "pro" | "enterprise",
            affiliateFounderId: data.affiliate_founder_id,
            offersInstallation: data.offers_installation ?? true,
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
