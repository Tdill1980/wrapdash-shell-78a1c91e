import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  Video, 
  Newspaper, 
  Lightbulb, 
  Target,
  Loader2,
  Send,
  User
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type RequestType = "email" | "reel" | "magazine" | "ideas" | "sales";

interface ContentRequestModalProps {
  open: boolean;
  onClose: () => void;
  requestType: RequestType;
}

const REQUEST_CONFIG: Record<RequestType, {
  title: string;
  agent: string;
  agentRole: string;
  icon: typeof Mail;
  color: string;
  folder: string;
}> = {
  email: {
    title: "Email / Campaign Request",
    agent: "Emily Carter",
    agentRole: "Marketing Content Lead",
    icon: Mail,
    color: "text-blue-400",
    folder: "01_Email_Campaigns"
  },
  reel: {
    title: "Reels / Social Request",
    agent: "Noah Bennett",
    agentRole: "Social Content Creator",
    icon: Video,
    color: "text-pink-400",
    folder: "02_Social_Reels"
  },
  magazine: {
    title: "Magazine / Editorial Request",
    agent: "Ryan Mitchell",
    agentRole: "Editorial Authority",
    icon: Newspaper,
    color: "text-purple-400",
    folder: "03_Magazine_InkEdge"
  },
  ideas: {
    title: "Content Idea",
    agent: "Backlog",
    agentRole: "Ideas Queue",
    icon: Lightbulb,
    color: "text-amber-400",
    folder: "06_Ideas_Backlog"
  },
  sales: {
    title: "Sales Strategy Request",
    agent: "Taylor Brooks / Evan Porter",
    agentRole: "Sales & Affiliate Ops",
    icon: Target,
    color: "text-emerald-400",
    folder: "04_Ads_Ready"
  }
};

const EMAIL_GOALS = [
  { value: "sales_push", label: "Push Sales (commercial, fleet, etc.)" },
  { value: "wrap_of_week", label: "Wrap of the Week" },
  { value: "founder_note", label: "Founder Note / Update" },
  { value: "commercial_fleet", label: "Commercial Fleet Focus" },
  { value: "promo", label: "Promotion / Offer" },
];

const REEL_STYLES = [
  { value: "founder", label: "Founder POV" },
  { value: "installer", label: "Installer POV" },
  { value: "proof", label: "Before/After Proof" },
  { value: "process", label: "Process / How-To" },
  { value: "hype", label: "Hype / Energy" },
];

const MAGAZINE_TYPES = [
  { value: "feature", label: "Shop Feature" },
  { value: "industry", label: "Industry Story" },
  { value: "editorial", label: "Editorial / Pull Quote" },
  { value: "interview", label: "Interview" },
];

export function ContentRequestModal({ open, onClose, requestType }: ContentRequestModalProps) {
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [goal, setGoal] = useState("");
  const [angle, setAngle] = useState("");
  const [audience, setAudience] = useState("");
  const [reelCount, setReelCount] = useState("3");
  const [reelStyle, setReelStyle] = useState("founder");
  const [platform, setPlatform] = useState("instagram");
  const [magazineType, setMagazineType] = useState("feature");
  const [subject, setSubject] = useState("");
  const [brief, setBrief] = useState("");
  const [leadContext, setLeadContext] = useState("");

  const config = REQUEST_CONFIG[requestType];
  const Icon = config.icon;

  const resetForm = () => {
    setGoal("");
    setAngle("");
    setAudience("");
    setReelCount("3");
    setReelStyle("founder");
    setPlatform("instagram");
    setMagazineType("feature");
    setSubject("");
    setBrief("");
    setLeadContext("");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Build the action payload based on request type
      let actionPayload: Record<string, unknown> = {
        request_type: requestType,
        agent: config.agent,
        folder: config.folder,
        created_at: new Date().toISOString(),
      };

      switch (requestType) {
        case "email":
          if (!goal) {
            toast.error("Please select an email goal");
            setSubmitting(false);
            return;
          }
          actionPayload = {
            ...actionPayload,
            goal,
            angle: angle || undefined,
            audience: audience || "WPW Customers",
            subfolder: goal === "wrap_of_week" ? "Wrap_of_the_Week" : 
                       goal === "commercial_fleet" ? "Commercial_Fleet" :
                       goal === "founder_note" ? "Founder_Notes" : "Weekly_Sales"
          };
          break;
          
        case "reel":
          actionPayload = {
            ...actionPayload,
            count: parseInt(reelCount),
            style: reelStyle,
            platform,
            brief: brief || undefined,
            subfolder: reelStyle === "founder" ? "Founder_Reels" :
                       reelStyle === "installer" ? "Installer_POV" :
                       reelStyle === "proof" ? "Proof_Before_After" : "WPW_Reels"
          };
          break;
          
        case "magazine":
          if (!subject) {
            toast.error("Please enter a subject/story");
            setSubmitting(false);
            return;
          }
          actionPayload = {
            ...actionPayload,
            type: magazineType,
            subject,
            brief: brief || undefined,
            subfolder: magazineType === "feature" ? "Features" :
                       magazineType === "industry" ? "Industry_Stories" : "Editorial_Pulls"
          };
          break;
          
        case "ideas":
          if (!brief) {
            toast.error("Please describe your idea");
            setSubmitting(false);
            return;
          }
          actionPayload = {
            ...actionPayload,
            idea: brief,
          };
          break;
          
        case "sales":
          if (!leadContext) {
            toast.error("Please provide context about the leads");
            setSubmitting(false);
            return;
          }
          actionPayload = {
            ...actionPayload,
            lead_context: leadContext,
            brief: brief || undefined,
          };
          break;
      }

      // Insert into ai_actions for Ops Desk visibility
      const { error } = await supabase.from("ai_actions").insert([{
        action_type: "content_request",
        action_payload: actionPayload as unknown as Record<string, unknown>,
        priority: requestType === "sales" ? "high" : "medium",
        resolved: false,
      }] as any);

      if (error) throw error;

      toast.success(`Request sent to ${config.agent}`, {
        description: "Task added to Ops Desk queue"
      });
      
      resetForm();
      onClose();
    } catch (err) {
      console.error("Failed to create content request:", err);
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <User className="w-3 h-3" />
            Assigned to: <span className="font-medium">{config.agent}</span>
            <span className="text-muted-foreground">({config.agentRole})</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Email Request Form */}
          {requestType === "email" && (
            <>
              <div className="space-y-2">
                <Label>Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="What's the email goal?" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Angle / Hook (optional)</Label>
                <Input
                  placeholder="e.g., Speed + reliability, Proof from recent install"
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Audience (optional)</Label>
                <Input
                  placeholder="e.g., Commercial fleet owners, Past customers"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Reel Request Form */}
          {requestType === "reel" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Reels</Label>
                  <Select value={reelCount} onValueChange={setReelCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} reel{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={reelStyle} onValueChange={setReelStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REEL_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Brief / Notes (optional)</Label>
                <Textarea
                  placeholder="e.g., Use shop footage from Monday, strong hooks"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Magazine Request Form */}
          {requestType === "magazine" && (
            <>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={magazineType} onValueChange={setMagazineType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAGAZINE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Subject / Story</Label>
                <Input
                  placeholder="e.g., Houdini Wraps shop story, Industry trends"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Additional Brief (optional)</Label>
                <Textarea
                  placeholder="Any specific angles or pull quotes needed..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Ideas Form */}
          {requestType === "ideas" && (
            <div className="space-y-2">
              <Label>Describe Your Idea</Label>
              <Textarea
                placeholder="What content idea do you want to save for later?"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Sales Strategy Form */}
          {requestType === "sales" && (
            <>
              <div className="space-y-2">
                <Label>Lead / Opportunity Context</Label>
                <Textarea
                  placeholder="e.g., 3 commercial leads stalled at quote stage, Need content to push fleet wraps"
                  value={leadContext}
                  onChange={(e) => setLeadContext(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  placeholder="Any specific content formats or angles you're thinking..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {config.agent.split(" ")[0]}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
