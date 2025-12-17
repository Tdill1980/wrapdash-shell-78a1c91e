import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  MessageCircle, 
  Mail, 
  Palette, 
  Instagram, 
  Users, 
  Heart, 
  Megaphone, 
  Camera,
  BookOpen
} from "lucide-react";

export interface AgentOption {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
}

export const AVAILABLE_AGENTS: AgentOption[] = [
  {
    id: "jordan_lee",
    name: "Jordan Lee",
    role: "Website & Sales",
    icon: MessageCircle,
    color: "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    id: "alex_morgan",
    name: "Alex Morgan",
    role: "Quotes & Pricing",
    icon: Mail,
    color: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    id: "grant_miller",
    name: "Grant Miller",
    role: "Design & Files",
    icon: Palette,
    color: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    id: "casey_ramirez",
    name: "Casey Ramirez",
    role: "Social & DMs",
    icon: Instagram,
    color: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20",
  },
  {
    id: "taylor_brooks",
    name: "Taylor Brooks",
    role: "Partnerships & Sales",
    icon: Users,
    color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    id: "evan_porter",
    name: "Evan Porter",
    role: "Affiliates",
    icon: Heart,
    color: "text-red-500 bg-red-500/10 hover:bg-red-500/20",
  },
  {
    id: "emily_carter",
    name: "Emily Carter",
    role: "Marketing Content",
    icon: Megaphone,
    color: "text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  {
    id: "noah_bennett",
    name: "Noah Bennett",
    role: "Social Content",
    icon: Camera,
    color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20",
  },
  {
    id: "ryan_mitchell",
    name: "Ryan Mitchell",
    role: "Editorial (Ink & Edge)",
    icon: BookOpen,
    color: "text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20",
  },
];

interface AgentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAgent: (agentId: string) => void;
}

export function AgentSelector({ open, onOpenChange, onSelectAgent }: AgentSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            Talk to Agent
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-2 py-4">
          {AVAILABLE_AGENTS.map((agent) => (
            <Button
              key={agent.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto py-3 px-4",
                agent.color
              )}
              onClick={() => {
                onSelectAgent(agent.id);
                onOpenChange(false);
              }}
            >
              <agent.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.role}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
