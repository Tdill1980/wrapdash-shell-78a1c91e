import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  CheckCircle,
  Circle,
  Sparkles,
  Package,
  Mail,
  MessageSquare,
  Image,
  FileText,
  ChevronRight,
  X,
  PartyPopper,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ElementType;
  badge?: string;
  checkFn: () => Promise<boolean>;
}

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, []);

  const checklistItems: ChecklistItem[] = [
    {
      id: "tradedna",
      title: "Complete TradeDNA Wizard",
      description: "Extract your unique brand voice for AI",
      route: "/tradedna",
      icon: Sparkles,
      badge: "Powers AI",
      checkFn: async () => {
        if (!organizationId) return false;
        // Check for actual tradedna_profile data (not is_active which doesn't exist)
        const { data } = await supabase
          .from("organization_tradedna" as any)
          .select("id, tradedna_profile")
          .eq("organization_id", organizationId)
          .maybeSingle();
        // Consider complete if record exists with tradedna_profile data
        return !!(data && (data as any).tradedna_profile);
      },
    },
    {
      id: "products",
      title: "Add Your Products & Pricing",
      description: "Set up your service catalog",
      route: "/settings/products",
      icon: Package,
      checkFn: async () => {
        if (!organizationId) return false;
        const { count } = await supabase
          .from("reseller_products" as any)
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId);
        return (count || 0) > 0;
      },
    },
    {
      id: "mightymail",
      title: "Activate Quote Follow-Up Emails",
      description: "Auto-recover abandoned quotes",
      route: "/mightymail-ai",
      icon: Mail,
      badge: "Revenue Booster",
      checkFn: async () => {
        if (!organizationId) return false;
        const { count } = await supabase
          .from("email_flows")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("is_active", true);
        return (count || 0) > 0;
      },
    },
    {
      id: "chatbot",
      title: "Install Website Chatbot",
      description: "Capture leads 24/7",
      route: "/admin/website-agent",
      icon: MessageSquare,
      checkFn: async () => {
        if (!organizationId) return false;
        const { count } = await supabase
          .from("chatbot_scripts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("is_active", true);
        return (count || 0) > 0;
      },
    },
    {
      id: "portfolio",
      title: "Upload First Portfolio Job",
      description: "Showcase your best work",
      route: "/portfolio",
      icon: Image,
      checkFn: async () => {
        if (!organizationId) return false;
        const { count } = await supabase
          .from("portfolio_jobs")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId);
        return (count || 0) > 0;
      },
    },
    {
      id: "quote",
      title: "Send Your First Quote",
      description: "Create and send a customer quote",
      route: "/mighty-customer",
      icon: FileText,
      checkFn: async () => {
        if (!organizationId) return false;
        const { count } = await supabase
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId);
        return (count || 0) > 0;
      },
    },
  ];

  useEffect(() => {
    const checkCompletion = async () => {
      if (!organizationId) return;

      setLoading(true);
      const completed = new Set<string>();

      for (const item of checklistItems) {
        try {
          const isComplete = await item.checkFn();
          if (isComplete) {
            completed.add(item.id);
          }
        } catch (err) {
          console.error(`Error checking ${item.id}:`, err);
        }
      }

      setCompletedItems(completed);
      setLoading(false);
    };

    checkCompletion();
  }, [organizationId]);

  // Check if dismissed from localStorage
  useEffect(() => {
    const isDismissed = localStorage.getItem("onboarding-checklist-dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("onboarding-checklist-dismissed", "true");
    setDismissed(true);
  };

  const completionPercentage = Math.round(
    (completedItems.size / checklistItems.length) * 100
  );

  // Don't show if dismissed, 100% complete, or admin user
  if (dismissed || completionPercentage === 100 || isAdmin) {
    return null;
  }

  return (
    <Card className="bg-card border-border relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Get Started with WrapCommand
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Progress value={completionPercentage} className="flex-1" />
          <span className="text-sm font-medium text-muted-foreground">
            {completionPercentage}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-2">
          {checklistItems.map((item) => {
            const isComplete = completedItems.has(item.id);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                  isComplete
                    ? "bg-muted/30 opacity-60"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}

                <Icon className="w-4 h-4 text-primary flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isComplete ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.badge && !isComplete && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
