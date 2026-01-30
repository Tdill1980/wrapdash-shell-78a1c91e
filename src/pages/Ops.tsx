import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Loader2, AlertTriangle } from "lucide-react";
import { OpsDeskCommandPanel } from "@/components/mightychat/OpsDeskCommandPanel";
import AgentControlPanel from "@/components/admin/jordan-dashboard/AgentControlPanel";
import { MainLayout } from "@/layouts/MainLayout";
import { Session } from "@supabase/supabase-js";

export default function Ops() {
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
              You don't have permission to access ops controls.
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
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Ops</h1>
            <p className="text-sm text-muted-foreground">
              Agent directives, scheduling, and system controls
            </p>
          </div>
        </div>

        {/* Ops Desk Command Panel */}
        <Card className="overflow-hidden">
          <OpsDeskCommandPanel />
        </Card>

        {/* Agent Control Panel */}
        <AgentControlPanel />
      </div>
    </MainLayout>
  );
}
