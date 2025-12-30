import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";

interface SystemIssue {
  id: string;
  organization_id: string;
  reported_by: string;
  title: string;
  description: string | null;
  category: string;
  impact: string;
  status: string;
  workaround: string | null;
  page_url: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: "Open", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-500 bg-red-500/10 border-red-500/30" },
  acknowledged: { label: "Acknowledged", icon: <Clock className="w-4 h-4" />, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  in_progress: { label: "In Progress", icon: <PlayCircle className="w-4 h-4" />, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  resolved: { label: "Resolved", icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500 bg-green-500/10 border-green-500/30" },
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  blocking: { label: "🔴 Blocking", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  slows_me_down: { label: "🟡 Slows Down", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
  cosmetic: { label: "🟢 Cosmetic", color: "bg-green-500/20 text-green-600 border-green-500/30" },
};

const CATEGORY_LABELS: Record<string, string> = {
  content_calendar: "Content Calendar",
  instagram: "Instagram",
  dm_chat: "MightyChat",
  email: "Email",
  ads: "Ads",
  quotes: "Quotes",
  ui_ux: "UI/UX",
  automation: "Automation",
  other: "Other",
};

export default function IssuesDashboard() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<SystemIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit modal
  const [editingIssue, setEditingIssue] = useState<SystemIssue | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editWorkaround, setEditWorkaround] = useState("");
  const [editResolution, setEditResolution] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkUserRole();
    loadIssues();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);

    // Check if admin/owner
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setIsAdmin(orgMember?.role === "admin" || orgMember?.role === "owner");
  };

  const loadIssues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues((data as SystemIssue[]) || []);
    } catch (err) {
      console.error("Error loading issues:", err);
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async () => {
    if (!editingIssue) return;
    setSaving(true);

    try {
      const updates: Partial<SystemIssue> = {
        status: editStatus,
        workaround: editWorkaround || null,
        resolution_notes: editResolution || null,
      };

      if (editStatus === "resolved" && editingIssue.status !== "resolved") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("system_issues")
        .update(updates)
        .eq("id", editingIssue.id);

      if (error) throw error;

      toast.success("Issue updated");
      setEditingIssue(null);
      loadIssues();
    } catch (err) {
      console.error("Error updating issue:", err);
      toast.error("Failed to update issue");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (issue: SystemIssue) => {
    setEditingIssue(issue);
    setEditStatus(issue.status);
    setEditWorkaround(issue.workaround || "");
    setEditResolution(issue.resolution_notes || "");
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (impactFilter !== "all" && issue.impact !== impactFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!issue.title.toLowerCase().includes(q) && 
          !issue.description?.toLowerCase().includes(q) &&
          !issue.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const blockingCount = issues.filter(i => i.impact === "blocking" && i.status !== "resolved").length;
  const openCount = issues.filter(i => i.status === "open").length;
  const resolvedThisWeek = issues.filter(i => {
    if (i.status !== "resolved" || !i.resolved_at) return false;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(i.resolved_at).getTime() > weekAgo;
  }).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
              Issues Dashboard
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Manage reported issues across the team" : "View your reported issues"}
            </p>
          </div>
          <Button variant="outline" onClick={loadIssues} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={cn("border-2", blockingCount > 0 && "border-red-500/50 bg-red-500/5")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{blockingCount}</p>
                <p className="text-sm text-muted-foreground">Blocking Issues</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-muted-foreground">Open Issues</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{resolvedThisWeek}</p>
                <p className="text-sm text-muted-foreground">Resolved This Week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="blocking">Blocking</SelectItem>
                  <SelectItem value="slows_me_down">Slows Down</SelectItem>
                  <SelectItem value="cosmetic">Cosmetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {filteredIssues.length} Issue{filteredIssues.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading issues...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
                <p className="font-medium">No issues found</p>
                <p className="text-sm">Everything looks good!</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="divide-y">
                  {filteredIssues.map((issue) => {
                    const statusConf = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
                    const impactConf = IMPACT_CONFIG[issue.impact] || IMPACT_CONFIG.cosmetic;
                    
                    return (
                      <div
                        key={issue.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          {/* Status Icon */}
                          <div className={cn("p-2 rounded-lg border shrink-0", statusConf.color)}>
                            {statusConf.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium">{issue.title}</h3>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTimeAZ(issue.created_at)}
                              </span>
                            </div>
                            
                            {issue.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {issue.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className={impactConf.color}>
                                {impactConf.label}
                              </Badge>
                              <Badge variant="secondary">
                                {CATEGORY_LABELS[issue.category] || issue.category}
                              </Badge>
                              {issue.page_url && (
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {issue.page_url}
                                </Badge>
                              )}
                            </div>
                            
                            {issue.workaround && (
                              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
                                <span className="font-semibold text-amber-600">Workaround: </span>
                                {issue.workaround}
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(issue)}
                              className="shrink-0"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingIssue} onOpenChange={(open) => !open && setEditingIssue(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Issue</DialogTitle>
          </DialogHeader>

          {editingIssue && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium">{editingIssue.title}</h4>
                {editingIssue.description && (
                  <p className="text-sm text-muted-foreground mt-1">{editingIssue.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Workaround (helps Jackson keep working)</Label>
                <Textarea
                  placeholder="Describe a temporary workaround if available..."
                  value={editWorkaround}
                  onChange={(e) => setEditWorkaround(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Resolution Notes</Label>
                <Textarea
                  placeholder="What was done to fix this..."
                  value={editResolution}
                  onChange={(e) => setEditResolution(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIssue(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateIssue} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
