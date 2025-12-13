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
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user's organization membership
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (!membership) {
          setIsLoading(false);
          return;
        }

        // Get organization role
        const { data: org } = await supabase
          .from("organizations")
          .select("role")
          .eq("id", membership.organization_id)
          .single();

        if (org?.role) {
          setRole(org.role as OrganizationRole);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, isLoading };
};
