import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Power, Loader2, AlertTriangle, Database, Shield } from "lucide-react";
import AgentControlPanel from "@/components/admin/jordan-dashboard/AgentControlPanel";
import { MainLayout } from "@/layouts/MainLayout";
import { Session } from "@supabase/supabase-js";

const TABS = [
  { id: "agents", label: "Agent Control", icon: Power, color: "bg-green-500" },
  { id: "integrations", label: "Integrations", icon: Database, color: "bg-blue-500" },
  { id: "security", label: "Security", icon: Shield, color: "bg-red-500" },
];

export default function Systems() {
  const [activeTab, setActiveTab] = useState("agents");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

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

  useEffect(() => {
    if (!session) return;

    const checkMembership = async () => {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", session.user.id)
        .limit(1)
        .single();

      if (!membership) {
        setAccessDenied(true);
      }
    };

    checkMembership();
  }, [session]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access system settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Systems</h1>
            <p className="text-sm text-muted-foreground">
              Agent scheduling, integrations, and system configuration
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            <AgentControlPanel />
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Integrations</p>
                <p className="text-sm">API keys, webhooks, and third-party connections</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Security Settings</p>
                <p className="text-sm">Access controls, audit logs, and permissions</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
