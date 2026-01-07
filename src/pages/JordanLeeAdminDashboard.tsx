import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, LogOut, BarChart3, Brain, Car, FileEdit, BookOpen, MessageSquare, FileText, FolderSearch, Star, Mail, Wrench, Power, Instagram, Loader2, AlertTriangle } from "lucide-react";
import { AnalyticsTab } from "@/components/admin/jordan-dashboard/AnalyticsTab";
import { AgenticAITab } from "@/components/admin/jordan-dashboard/AgenticAITab";
import { WrapGuruTab } from "@/components/admin/jordan-dashboard/WrapGuruTab";
import { CorrectionsTab } from "@/components/admin/jordan-dashboard/CorrectionsTab";
import { KnowledgeBaseTab } from "@/components/admin/jordan-dashboard/KnowledgeBaseTab";
import { ChatSessionsTab } from "@/components/admin/jordan-dashboard/ChatSessionsTab";
import { QuotesTab } from "@/components/admin/jordan-dashboard/QuotesTab";
import { FileAnalysisTab } from "@/components/admin/jordan-dashboard/FileAnalysisTab";
import { ReviewsTab } from "@/components/admin/jordan-dashboard/ReviewsTab";
import { EmailTrackingTab } from "@/components/admin/jordan-dashboard/EmailTrackingTab";
import { ToolsTab } from "@/components/admin/jordan-dashboard/ToolsTab";
import AgentControlPanel from "@/components/admin/jordan-dashboard/AgentControlPanel";
import { RecoveredLeadsTab } from "@/components/admin/jordan-dashboard/RecoveredLeadsTab";
import { Session } from "@supabase/supabase-js";

const TABS = [
  { id: "control", label: "Agent Control", icon: Power, color: "bg-red-500" },
  { id: "recovered", label: "Recovered IG Leads", icon: Instagram, color: "bg-pink-500" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "bg-green-500" },
  { id: "agentic", label: "Agentic AI", icon: Brain, color: "bg-orange-500" },
  { id: "wrapguru", label: "WrapGuru", icon: Car, color: "bg-purple-500" },
  { id: "corrections", label: "Corrections", icon: FileEdit, color: "bg-red-500" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, color: "bg-teal-500" },
  { id: "chats", label: "Website Page Chat", icon: MessageSquare, color: "bg-blue-500" },
  { id: "quotes", label: "Quotes", icon: FileText, color: "bg-indigo-500" },
  { id: "files", label: "File Analysis", icon: FolderSearch, color: "bg-pink-500" },
  { id: "reviews", label: "Reviews", icon: Star, color: "bg-yellow-500" },
  { id: "email", label: "Email Tracking", icon: Mail, color: "bg-cyan-500" },
  { id: "tools", label: "Tools", icon: Wrench, color: "bg-gray-500" },
];

export default function JordanLeeAdminDashboard() {
  const [activeTab, setActiveTab] = useState("control");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orgMembership, setOrgMembership] = useState<{
    organizationId: string;
    organizationName: string;
    role: string;
  } | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Organization membership check
  useEffect(() => {
    if (!session) return;

    const checkMembership = async () => {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(name)")
        .eq("user_id", session.user.id)
        .limit(1)
        .single();

      if (!membership) {
        setAccessDenied(true);
      } else {
        const orgData = membership.organizations as { name: string } | null;
        setOrgMembership({
          organizationId: membership.organization_id,
          organizationName: orgData?.name || "Unknown Organization",
          role: membership.role
        });
      }
    };

    checkMembership();
  }, [session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No session - redirect to auth
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Access denied - no org membership
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You are not a member of any organization. Contact an administrator for access.
            </p>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Website Page Chat — <span className="text-primary">WePrintWraps.com</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage live website chat conversations from weprintwraps.com
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium text-foreground">{session.user.email}</span>
              {orgMembership && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {orgMembership.organizationName} ({orgMembership.role})
                </span>
              )}
            </span>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Colorful Tab Bar */}
          <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0 justify-start">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    data-[state=active]:text-white data-[state=active]:${tab.color}
                    data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
                    data-[state=inactive]:hover:bg-muted/80
                  `}
                  style={{
                    backgroundColor: activeTab === tab.id ? undefined : undefined,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="control" className="mt-6">
            <AgentControlPanel />
          </TabsContent>

          <TabsContent value="recovered" className="mt-6">
            <RecoveredLeadsTab />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="agentic" className="mt-6">
            <AgenticAITab />
          </TabsContent>

          <TabsContent value="wrapguru" className="mt-6">
            <WrapGuruTab />
          </TabsContent>

          <TabsContent value="corrections" className="mt-6">
            <CorrectionsTab />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBaseTab />
          </TabsContent>

          <TabsContent value="chats" className="mt-6">
            <ChatSessionsTab />
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            <QuotesTab />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <FileAnalysisTab />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewsTab />
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <EmailTrackingTab />
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <ToolsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
