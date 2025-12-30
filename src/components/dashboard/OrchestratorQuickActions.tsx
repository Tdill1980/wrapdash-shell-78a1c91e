import { useNavigate } from "react-router-dom";
import { 
  Film, MessageSquare, Calendar, Send, TrendingUp, 
  Image, Sparkles, Mail, ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Film;
  href: string;
  color: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "create_reel",
    label: "Create Reel",
    icon: Film,
    href: "/mightychat?agent=noah&prompt=create%20a%20reel",
    color: "from-purple-500 to-pink-500",
    description: "Ask Noah to create a video"
  },
  {
    id: "answer_dms",
    label: "Answer DMs",
    icon: MessageSquare,
    href: "/mightychat?stream=dms",
    color: "from-blue-500 to-cyan-500",
    description: "Respond to social messages"
  },
  {
    id: "check_emails",
    label: "Check Emails",
    icon: Mail,
    href: "/mightychat?stream=hello",
    color: "from-green-500 to-emerald-500",
    description: "Review inbox messages"
  },
  {
    id: "schedule_content",
    label: "Schedule",
    icon: Calendar,
    href: "/content-calendar?mode=execute",
    color: "from-amber-500 to-orange-500",
    description: "Manage content calendar"
  },
  {
    id: "create_ad",
    label: "Create Ad",
    icon: Image,
    href: "/mightychat?agent=emily&prompt=create%20an%20ad",
    color: "from-red-500 to-pink-500",
    description: "Ask Emily to design an ad"
  },
  {
    id: "check_ads",
    label: "Check Ads",
    icon: TrendingUp,
    href: "/paid-ads-performance",
    color: "from-indigo-500 to-violet-500",
    description: "Review ad performance"
  },
  {
    id: "new_campaign",
    label: "Campaign",
    icon: Send,
    href: "/mightychat?agent=casey&prompt=create%20campaign",
    color: "from-teal-500 to-cyan-500",
    description: "Ask Casey to build a campaign"
  },
  {
    id: "backlog",
    label: "Backlog",
    icon: ListTodo,
    href: "/backlog",
    color: "from-gray-500 to-slate-600",
    description: "View pending tasks"
  },
];

export function OrchestratorQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 border-border/50 hover:border-primary/50 transition-all group"
            )}
            onClick={() => navigate(action.href)}
            title={action.description}
          >
            <div className={cn(
              "w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br",
              action.color
            )}>
              <Icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
