import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  MessageSquare, 
  Mail, 
  Instagram, 
  Globe, 
  Settings, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIStatus } from "@/hooks/useAIStatus";

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  channels: string[];
  inbox?: string;
  color: string;
  enabled: boolean;
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: "jordan_lee",
    name: "Jordan Lee",
    role: "Website Chat Agent",
    description: "Handles live website chat, qualifies leads, captures emails, and answers product questions",
    icon: <Globe className="w-5 h-5" />,
    channels: ["Website Chat"],
    color: "cyan",
    enabled: true,
  },
  {
    id: "alex_morgan",
    name: "Alex Morgan",
    role: "Sales & Quotes Agent",
    description: "Manages hello@ inbox, processes quote requests, and handles general inquiries",
    icon: <Mail className="w-5 h-5" />,
    channels: ["Email"],
    inbox: "hello@weprintwraps.com",
    color: "green",
    enabled: true,
  },
  {
    id: "grant_miller",
    name: "Grant Miller",
    role: "Design Review Agent",
    description: "Handles design@ inbox, processes design approvals, and manages revision requests",
    icon: <Mail className="w-5 h-5" />,
    channels: ["Email"],
    inbox: "design@weprintwraps.com",
    color: "purple",
    enabled: true,
  },
  {
    id: "casey_ramirez",
    name: "Casey Ramirez",
    role: "Social Media Agent",
    description: "Manages Instagram DMs, handles influencer inquiries, and social engagement",
    icon: <Instagram className="w-5 h-5" />,
    channels: ["Instagram", "Facebook"],
    color: "pink",
    enabled: true,
  },
  {
    id: "manny_chen",
    name: "Manny Chen",
    role: "Operations Agent",
    description: "Handles jackson@ inbox, manages internal routing and approvals",
    icon: <Settings className="w-5 h-5" />,
    channels: ["Email"],
    inbox: "jackson@weprintwraps.com",
    color: "orange",
    enabled: true,
  },
];

export function AgentsManagement() {
  const { mode, loading: aiLoading } = useAIStatus();
  const [agents, setAgents] = useState(AGENT_CONFIGS);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => 
      prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, enabled: !agent.enabled }
          : agent
      )
    );
  };

  const getColorClasses = (color: string, enabled: boolean) => {
    if (!enabled) return "bg-muted/50 border-muted";
    const colorMap: Record<string, string> = {
      cyan: "border-cyan-500/30 bg-cyan-500/5",
      green: "border-green-500/30 bg-green-500/5",
      purple: "border-purple-500/30 bg-purple-500/5",
      pink: "border-pink-500/30 bg-pink-500/5",
      orange: "border-orange-500/30 bg-orange-500/5",
    };
    return colorMap[color] || "border-border bg-card";
  };

  const getIconColorClass = (color: string, enabled: boolean) => {
    if (!enabled) return "text-muted-foreground";
    const colorMap: Record<string, string> = {
      cyan: "text-cyan-500",
      green: "text-green-500",
      purple: "text-purple-500",
      pink: "text-pink-500",
      orange: "text-orange-500",
    };
    return colorMap[color] || "text-foreground";
  };

  const enabledCount = agents.filter(a => a.enabled).length;
  const totalCount = agents.length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Agents
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage and monitor your AI-powered agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Global AI Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <span className="text-xs text-muted-foreground">System:</span>
              {aiLoading ? (
                <Badge variant="outline" className="text-xs">Loading...</Badge>
              ) : mode === 'live' ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              ) : mode === 'manual' ? (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  MANUAL
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <XCircle className="w-3 h-3 mr-1" />
                  OFF
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-sm">
              {enabledCount}/{totalCount} Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {agents.map((agent) => (
            <Card 
              key={agent.id}
              className={cn(
                "transition-all duration-200 border-2",
                getColorClasses(agent.color, agent.enabled),
                !agent.enabled && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Agent Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    agent.enabled ? "bg-background shadow-sm" : "bg-muted/50"
                  )}>
                    <div className={getIconColorClass(agent.color, agent.enabled)}>
                      {agent.icon}
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn(
                        "font-semibold text-base",
                        !agent.enabled && "text-muted-foreground"
                      )}>
                        {agent.name}
                      </h3>
                      {agent.enabled ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] h-5">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {agent.role}
                    </p>
                    
                    <p className="text-xs text-muted-foreground/80 mb-3 line-clamp-2">
                      {agent.description}
                    </p>

                    {/* Channels & Inbox */}
                    <div className="flex flex-wrap items-center gap-2">
                      {agent.channels.map((channel) => (
                        <Badge 
                          key={channel} 
                          variant="outline" 
                          className={cn(
                            "text-[10px]",
                            !agent.enabled && "opacity-50"
                          )}
                        >
                          {channel === "Website Chat" && <Globe className="w-3 h-3 mr-1" />}
                          {channel === "Email" && <Mail className="w-3 h-3 mr-1" />}
                          {channel === "Instagram" && <Instagram className="w-3 h-3 mr-1" />}
                          {channel === "Facebook" && <MessageSquare className="w-3 h-3 mr-1" />}
                          {channel}
                        </Badge>
                      ))}
                      {agent.inbox && (
                        <Badge variant="secondary" className={cn(
                          "text-[10px]",
                          !agent.enabled && "opacity-50"
                        )}>
                          {agent.inbox}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex flex-col items-end gap-2">
                    <Switch
                      checked={agent.enabled}
                      onCheckedChange={() => toggleAgent(agent.id)}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 px-2"
                      disabled={!agent.enabled}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Stats Row (when enabled) */}
                {agent.enabled && (
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>24 responses today</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Avg. 12s response</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>98% satisfaction</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Agents respond based on the global AI status setting. When set to MANUAL, all agent responses require approval before sending.
        </p>
      </div>
    </div>
  );
}
