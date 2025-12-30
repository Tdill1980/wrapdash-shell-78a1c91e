import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bug, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "content_calendar", label: "Content Calendar" },
  { value: "instagram", label: "Instagram / DMs" },
  { value: "dm_chat", label: "MightyChat" },
  { value: "email", label: "Email Campaigns" },
  { value: "ads", label: "Ads / Performance" },
  { value: "quotes", label: "Quotes / Pricing" },
  { value: "ui_ux", label: "UI / Display Issue" },
  { value: "automation", label: "Automation / AI" },
  { value: "other", label: "Other" },
];

const IMPACTS = [
  { value: "blocking", label: "🔴 Blocking", description: "I cannot continue working" },
  { value: "slows_me_down", label: "🟡 Slows Me Down", description: "I can work around it but it's painful" },
  { value: "cosmetic", label: "🟢 Cosmetic", description: "Minor issue, doesn't affect work" },
];

export function IssueReporter() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [impact, setImpact] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Get organization
        const { data: orgMember } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .single();
        if (orgMember) {
          setOrganizationId(orgMember.organization_id);
        }
      }
    };
    fetchUser();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setImpact("");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category || !impact) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!userId || !organizationId) {
      toast.error("You must be logged in to report an issue");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("system_issues").insert({
        organization_id: organizationId,
        reported_by: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        impact,
        page_url: location.pathname,
        status: "open",
      });

      if (error) throw error;

      toast.success("Issue reported! We'll look into it.", {
        description: impact === "blocking" 
          ? "Check for a workaround while we fix this"
          : "Thanks for the feedback"
      });
      
      resetForm();
      setIsOpen(false);
    } catch (err) {
      console.error("Error submitting issue:", err);
      toast.error("Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show on public pages
  const publicPaths = ["/auth", "/signup", "/beta/signup", "/customer/", "/track/", "/affiliate/card/"];
  const isPublicPage = publicPaths.some(path => location.pathname.startsWith(path));
  
  if (isPublicPage || !userId) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 h-12 px-4 shadow-lg",
          "bg-amber-500 hover:bg-amber-600 text-white",
          "flex items-center gap-2 rounded-full"
        )}
      >
        <Bug className="w-5 h-5" />
        <span className="hidden sm:inline">Report Issue</span>
      </Button>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Report an Issue
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Page */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
              <span>Page:</span>
              <code className="font-mono text-foreground">{location.pathname}</code>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">What's the issue? *</Label>
              <Input
                id="title"
                placeholder="Brief description of what's wrong..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Impact */}
            <div className="space-y-2">
              <Label>How much does this affect you? *</Label>
              <div className="grid grid-cols-1 gap-2">
                {IMPACTS.map((imp) => (
                  <button
                    key={imp.value}
                    type="button"
                    onClick={() => setImpact(imp.value)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                      impact === imp.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div>
                      <span className="font-medium">{imp.label}</span>
                      <p className="text-xs text-muted-foreground">{imp.description}</p>
                    </div>
                    {impact === imp.value && (
                      <Badge variant="default" className="ml-2">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">More details (optional)</Label>
              <Textarea
                id="description"
                placeholder="What were you trying to do? What happened instead?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
