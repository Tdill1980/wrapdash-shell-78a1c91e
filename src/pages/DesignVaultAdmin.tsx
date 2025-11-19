import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Database,
  Trash2,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Layout,
  Upload,
} from "lucide-react";
import { DashboardCardPreview } from "@/modules/designvault/components/DashboardCardPreview";
import { DesignUploadForm } from "@/modules/designvault/components/DesignUploadForm";

interface Design {
  id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  color_name: string | null;
  finish_type: string;
  tags: string[] | null;
  created_at: string;
  render_urls: any;
}

export default function DesignVaultAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [finishFilter, setFinishFilter] = useState<string>("all");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchDesigns();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterDesigns();
  }, [designs, searchQuery, finishFilter]);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from("color_visualizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDesigns(data || []);
    } catch (error) {
      console.error("Error fetching designs:", error);
      toast({
        title: "Error",
        description: "Failed to load designs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDesigns = () => {
    let filtered = [...designs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (design) =>
          design.vehicle_make?.toLowerCase().includes(query) ||
          design.vehicle_model?.toLowerCase().includes(query) ||
          design.color_name?.toLowerCase().includes(query) ||
          design.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (finishFilter !== "all") {
      filtered = filtered.filter((design) => design.finish_type === finishFilter);
    }

    setFilteredDesigns(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredDesigns.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one design to delete.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} design(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("color_visualizations")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.size} design(s) deleted successfully.`,
      });

      setSelectedIds(new Set());
      await fetchDesigns();
    } catch (error) {
      console.error("Error deleting designs:", error);
      toast({
        title: "Error",
        description: "Failed to delete designs.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const uniqueFinishes = Array.from(
    new Set(designs.map((d) => d.finish_type))
  ).sort();

  if (adminLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">
            <span className="text-foreground">Design</span>
            <span className="text-gradient">
              Vault
            </span>
            <span className="text-muted-foreground text-xl"> Admin</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all DesignVault visualizations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/designvault")}>
            <Database className="w-4 h-4 mr-2" />
            View Public Gallery
          </Button>
          <Link to="/admin/users">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload to DesignVault
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Add new designs that will appear on the dashboard
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DesignUploadForm onUploadComplete={fetchDesigns} />
        </CardContent>
      </Card>

      {/* Dashboard Card Preview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                Dashboard Preview
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                See how your designs appear on the main dashboard
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DashboardCardPreview />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filters & Actions</span>
            <Badge variant="secondary">{filteredDesigns.length} designs</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, color, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={finishFilter}
                onChange={(e) => setFinishFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Finishes</option>
                {uniqueFinishes.map((finish) => (
                  <option key={finish} value={finish}>
                    {finish}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={
                  filteredDesigns.length > 0 &&
                  selectedIds.size === filteredDesigns.length
                }
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm cursor-pointer">
                Select All ({selectedIds.size} selected)
              </label>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredDesigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || finishFilter !== "all"
                ? "No designs match your filters."
                : "No designs found in the vault."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDesigns.map((design) => (
            <Card key={design.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedIds.has(design.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(design.id, checked as boolean)
                    }
                  />
                  <div className="w-24 h-24 rounded-lg bg-background border border-border overflow-hidden flex-shrink-0">
                    {(() => {
                      const renderUrls = design.render_urls;
                      let imageUrl = null;

                      if (Array.isArray(renderUrls) && renderUrls.length > 0) {
                        imageUrl = renderUrls[0];
                      } else if (renderUrls && typeof renderUrls === "object") {
                        imageUrl =
                          renderUrls.hero_angle ||
                          renderUrls.hero ||
                          renderUrls.front;
                      }

                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${design.vehicle_make} ${design.vehicle_model}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Database className="w-8 h-8 text-muted-foreground" />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {design.vehicle_year} {design.vehicle_make}{" "}
                      {design.vehicle_model}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {design.color_name || "Custom Color"} • {design.finish_type}
                    </p>
                    {design.tags && design.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {design.tags.slice(0, 5).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {new Date(design.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
