import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OrganizationRole = "beta_shop" | "affiliate" | "admin";

export const useUserRole = () => {
  const [role, setRole] = useState<OrganizationRole>("beta_shop");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[useUserRole] Current user:', user?.email, user?.id);
        
        if (!user) {
          console.log('[useUserRole] No user found, using default role: beta_shop');
          setIsLoading(false);
          return;
        }

        // Get user's organization membership
        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        console.log('[useUserRole] Membership:', membership, 'Error:', membershipError);

        if (!membership) {
          console.log('[useUserRole] No membership found, using default role: beta_shop');
          setIsLoading(false);
          return;
        }

        // Get organization role
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("role, name")
          .eq("id", membership.organization_id)
          .single();

        console.log('[useUserRole] Organization:', org, 'Error:', orgError);

        if (org?.role) {
          console.log('[useUserRole] Setting role to:', org.role);
          setRole(org.role as OrganizationRole);
        } else {
          console.log('[useUserRole] No org role found, using default: beta_shop');
        }
      } catch (error) {
        console.error("[useUserRole] Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useUserRole] Auth state changed:', event, session?.user?.email);
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log('[useUserRole] Returning role:', role, 'isLoading:', isLoading);
  return { role, isLoading };
};
