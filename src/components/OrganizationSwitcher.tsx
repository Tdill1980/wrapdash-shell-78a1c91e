import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  role: string;
}

export const OrganizationSwitcher = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get all organizations the user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setIsLoading(false);
        return;
      }

      const orgIds = memberships.map((m) => m.organization_id);

      // Get organization details
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, subdomain, role")
        .in("id", orgIds)
        .order("name");

      if (orgError) throw orgError;

      setOrganizations(orgs || []);
      
      // Set current org from localStorage or default to first
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      const savedOrg = orgs?.find((o) => o.id === savedOrgId);
      setCurrentOrg(savedOrg || orgs?.[0] || null);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSwitch = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem("currentOrganizationId", org.id);
    // Reload the page to apply new org context
    window.location.reload();
  };

  // Don't show switcher if user has 0 or 1 organization
  if (isLoading || organizations.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer focus:outline-none">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="text-sm text-white font-medium max-w-[120px] truncate">
          {currentOrg?.name || "Select Org"}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-[#1A1D24] border-white/10 z-[100]">
        <DropdownMenuLabel className="text-white/90">Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgSwitch(org)}
            className="flex items-center justify-between text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <div>
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-muted-foreground">{org.subdomain}</div>
              </div>
            </div>
            {currentOrg?.id === org.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => navigate("/admin/organizations")}
          className="text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Manage Organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
