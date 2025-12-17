import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Eye, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Agent definitions for command parsing
const AGENTS = {
  alex: { name: "Alex Morgan", role: "Quotes Agent", stream: "quotes" },
  grant: { name: "Grant Miller", role: "Design Agent", stream: "design" },
  casey: { name: "Casey Ramirez", role: "Affiliate Manager", stream: "affiliates" },
  jordan: { name: "Jordan Lee", role: "Sales Agent", stream: "website" },
  evan: { name: "Evan Porter", role: "Affiliate Ops", stream: "affiliates" },
  emily: { name: "Emily Carter", role: "Marketing Content", stream: "content" },
  noah: { name: "Noah Bennett", role: "Social Content", stream: "content" },
  taylor: { name: "Taylor Brooks", role: "Field Ops", stream: "partnerships" },
  ryan: { name: "Ryan Mitchell", role: "Editorial", stream: "editorial" },
};

type AgentKey = keyof typeof AGENTS;

const EXAMPLE_COMMANDS = [
  "Alex — follow up on quotes older than 24 hours",
  "Grant — review design@ for scope creep",
  "Casey — send update email to sponsored wrap artists",
  "Evan — identify affiliates worth sponsoring this week",
  "Emily — draft a 3-email promo for turnaround speed",
];

interface ParsedCommand {
  targetAgent: string | null;
  agentInfo: typeof AGENTS[AgentKey] | null;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  revenueImpact: boolean;
  cxImpact: boolean;
}

function parseCommand(input: string): ParsedCommand {
  const lowered = input.toLowerCase();
  
  // Find target agent
  let targetAgent: AgentKey | null = null;
  let agentInfo: typeof AGENTS[AgentKey] | null = null;
  
  for (const [key, agent] of Object.entries(AGENTS)) {
    const firstName = agent.name.split(' ')[0].toLowerCase();
    if (lowered.includes(firstName) || lowered.startsWith(firstName)) {
      targetAgent = key as AgentKey;
      agentInfo = agent;
      break;
    }
  }
  
  // Extract intent (everything after the agent name or dash)
  let intent = input;
  const dashIndex = input.indexOf('—');
  const hyphenIndex = input.indexOf('-');
  const colonIndex = input.indexOf(':');
  
  const separatorIndex = Math.min(
    dashIndex > -1 ? dashIndex : Infinity,
    hyphenIndex > -1 ? hyphenIndex : Infinity,
    colonIndex > -1 ? colonIndex : Infinity
  );
  
  if (separatorIndex !== Infinity) {
    intent = input.slice(separatorIndex + 1).trim();
  }
  
  // Determine risk levels
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'risk', 'angry', 'complaint', 'refund'];
  const revenueKeywords = ['quote', 'order', 'sale', 'revenue', 'follow up', 'pricing', 'lead'];
  const cxKeywords = ['customer', 'complaint', 'issue', 'problem', 'frustrated', 'waiting'];
  
  const isUrgent = urgentKeywords.some(k => lowered.includes(k));
  const hasRevenueImpact = revenueKeywords.some(k => lowered.includes(k));
  const hasCxImpact = cxKeywords.some(k => lowered.includes(k));
  
  let riskLevel: "low" | "medium" | "high" = "low";
  if (isUrgent || (hasRevenueImpact && hasCxImpact)) riskLevel = "high";
  else if (hasRevenueImpact || hasCxImpact) riskLevel = "medium";
  
  return {
    targetAgent,
    agentInfo,
    intent,
    riskLevel,
    revenueImpact: hasRevenueImpact,
    cxImpact: hasCxImpact,
  };
}

export function OpsDeskCommandPanel() {
  const [command, setCommand] = useState("");
  const [preview, setPreview] = useState<ParsedCommand | null>(null);
  const [executing, setExecuting] = useState(false);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  const handlePreview = () => {
    if (!command.trim()) return;
    const parsed = parseCommand(command);
    setPreview(parsed);
  };

  const handleExecute = async () => {
    if (!command.trim()) return;
    
    setExecuting(true);
    const parsed = preview || parseCommand(command);
    
    try {
      // Create MightyTask via ai_actions
      const { error } = await supabase
        .from('ai_actions')
        .insert({
          action_type: 'ops_desk_directive',
          action_payload: {
            command: command,
            target_agent: parsed.agentInfo?.name || 'Unassigned',
            intent: parsed.intent,
            risk_level: parsed.riskLevel,
            revenue_impact: parsed.revenueImpact ? 'yes' : 'no',
            cx_impact: parsed.cxImpact ? 'yes' : 'no',
            requested_by: 'Ops Desk Command',
            assigned_to: parsed.agentInfo?.name || 'Ops Desk',
          },
          priority: parsed.riskLevel === 'high' ? 'urgent' : parsed.riskLevel === 'medium' ? 'high' : 'normal',
          resolved: false,
        });

      if (error) throw error;
      
      toast.success(
        `Directive sent to ${parsed.agentInfo?.name || 'team'}`,
        { description: "Task created in MightyTask" }
      );
      
      setLastExecuted(command);
      setCommand("");
      setPreview(null);
    } catch (err) {
      console.error('Execute command error:', err);
      toast.error('Failed to execute directive');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-amber-600" />
        <h3 className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide text-sm">
          Ops Desk — Command
        </h3>
      </div>
      
      {/* Command Input */}
      <div className="space-y-3">
        <Textarea
          value={command}
          onChange={(e) => {
            setCommand(e.target.value);
            setPreview(null);
          }}
          placeholder="Type a directive for the team…"
          className="min-h-[60px] bg-background/80 border-amber-200 dark:border-amber-800 focus:border-amber-400 resize-none"
        />
        
        {/* Example Commands */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase">Examples:</span>
          {EXAMPLE_COMMANDS.slice(0, 3).map((ex, i) => (
            <button
              key={i}
              onClick={() => setCommand(ex)}
              className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline truncate max-w-[200px]"
            >
              "{ex.slice(0, 40)}…"
            </button>
          ))}
        </div>
        
        {/* Preview Panel */}
        {preview && (
          <div className="bg-background/90 rounded-lg p-3 border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Preview</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px]",
                  preview.riskLevel === 'high' && "border-red-400 text-red-600",
                  preview.riskLevel === 'medium' && "border-amber-400 text-amber-600",
                  preview.riskLevel === 'low' && "border-gray-300 text-gray-500",
                )}
              >
                {preview.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Target:</span>{' '}
                <span className="font-medium">
                  {preview.agentInfo?.name || 'All Agents'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>{' '}
                <span className="font-medium">
                  {preview.agentInfo?.role || 'General'}
                </span>
              </div>
            </div>
            
            <div className="text-xs">
              <span className="text-muted-foreground">Intent:</span>{' '}
              <span className="font-medium">{preview.intent}</span>
            </div>
            
            <div className="flex gap-2">
              {preview.revenueImpact && (
                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40">
                  💰 Revenue
                </Badge>
              )}
              {preview.cxImpact && (
                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                  👤 CX
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Last Executed */}
        {lastExecuted && !command && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Last: "{lastExecuted.slice(0, 50)}…"</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={!command.trim() || executing}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview Tasks
          </Button>
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={!command.trim() || executing}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Send className="w-4 h-4 mr-1" />
            {executing ? "Executing…" : "Execute"}
          </Button>
        </div>
      </div>
    </div>
  );
}
