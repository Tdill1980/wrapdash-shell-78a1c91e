import React, { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Plus, Users, ExternalLink, Sparkles, Dna } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  role: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
}

const AdminOrganizations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [orgRole, setOrgRole] = useState<"beta_shop" | "affiliate" | "admin">("beta_shop");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !subdomain.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      toast({
        title: "Invalid subdomain",
        description: "Subdomain can only contain lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if subdomain already exists
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("subdomain", subdomain.toLowerCase())
        .single();

      if (existing) {
        toast({
          title: "Subdomain taken",
          description: "This subdomain is already in use",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgName,
          subdomain: subdomain.toLowerCase(),
          role: orgRole,
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add current user as owner member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created",
        description: `${orgName} has been created successfully`,
      });

      // Reset form and refresh list
      setOrgName("");
      setSubdomain("");
      setOrgRole("beta_shop");
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "affiliate":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <MainLayout userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-7 h-7" />
              Organization Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage workspaces for Ink & Edge, WrapTV, and other brands
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/add-organization")}
            className="bg-primary hover:bg-primary/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Add New Brand (AI Wizard)
          </Button>
        </div>

        {/* Create Organization Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Organization
            </CardTitle>
            <CardDescription>
              Add a new workspace for a brand like Ink & Edge Magazine or WrapTV World
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Ink & Edge Magazine"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    placeholder="inkandedge"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="bg-background"
                  />
                  <span className="text-muted-foreground text-sm whitespace-nowrap">.wrapcommandai.com</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Organization Role</Label>
                <Select value={orgRole} onValueChange={(v) => setOrgRole(v as any)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beta_shop">Beta Shop</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleCreateOrganization} 
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? "Creating..." : "Create Organization"}
            </Button>
          </CardContent>
        </Card>

        {/* Organizations List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Organizations
            </CardTitle>
            <CardDescription>
              {organizations.length} organization{organizations.length !== 1 ? "s" : ""} in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading organizations...</div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No organizations yet. Create your first one above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {org.subdomain}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(org.role)}>
                          {org.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.is_active ? "default" : "secondary"}>
                          {org.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/tradedna?org=${org.id}`, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          TradeDNA
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminOrganizations;
