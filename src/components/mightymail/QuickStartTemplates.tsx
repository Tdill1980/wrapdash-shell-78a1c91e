import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Zap,
  Mail,
  RotateCcw,
  Heart,
  Clock,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  flowType: string;
  steps: {
    delay_hours: number;
    subject: string;
    preview_text: string;
    body_html: string;
  }[];
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: "quote-followup",
    name: "Quote Follow-Up",
    description: "Recover abandoned quotes with a 3-email sequence",
    icon: Mail,
    badge: "High Impact",
    badgeVariant: "default",
    flowType: "quote_followup",
    steps: [
      {
        delay_hours: 24,
        subject: "Quick question about your {{vehicle}} wrap quote",
        preview_text: "Just checking in on your vehicle transformation plans...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>I noticed you were looking at getting your {{vehicle}} wrapped. Just wanted to check in and see if you had any questions about the quote we put together.</p>
<p>Whether it's about the materials, timeline, or pricing - I'm here to help.</p>
<p>Let me know what you're thinking!</p>
<p>- {{shop_name}} Team</p>`,
      },
      {
        delay_hours: 72,
        subject: "Your {{vehicle}} transformation is waiting 🔥",
        preview_text: "Still thinking about that wrap? Here's what you could have...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>Still thinking about wrapping your {{vehicle}}? I totally get it - it's a big decision.</p>
<p>But imagine pulling up in a head-turning ride that reflects YOUR style. That's what we do best.</p>
<p>If timing or budget is the concern, let's chat. We might be able to work something out.</p>
<p>Ready when you are!</p>
<p>- {{shop_name}} Team</p>`,
      },
      {
        delay_hours: 168,
        subject: "Last chance: Your quote expires soon",
        preview_text: "Don't miss out on your {{vehicle}} transformation",
        body_html: `<p>Hey {{customer_name}},</p>
<p>Just a heads up - the quote we put together for your {{vehicle}} is expiring soon.</p>
<p>Material prices fluctuate, and I want to make sure you get the best deal.</p>
<p>If you're still interested, reply to this email or give us a call. We'd love to make it happen for you.</p>
<p>After this, we'd need to requote based on current pricing.</p>
<p>- {{shop_name}} Team</p>`,
      },
    ],
  },
  {
    id: "winback",
    name: "Winback Sequence",
    description: "Re-engage past customers after 30/60/90 days",
    icon: RotateCcw,
    badge: "Revenue Recovery",
    badgeVariant: "secondary",
    flowType: "winback",
    steps: [
      {
        delay_hours: 720, // 30 days
        subject: "We miss you! Ready for a refresh?",
        preview_text: "It's been a while since your last wrap...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>It's been about a month since we last worked together, and I wanted to reach out.</p>
<p>How's that wrap holding up? Any scratches, peeling, or areas that need attention?</p>
<p>If you're thinking about refreshing your look or protecting that investment with PPF, we've got you covered.</p>
<p>Book a quick inspection - on us.</p>
<p>- {{shop_name}} Team</p>`,
      },
      {
        delay_hours: 1440, // 60 days
        subject: "New products you might love 👀",
        preview_text: "We've got some exciting new options...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>We've added some killer new products to our lineup that I think you'd love:</p>
<ul>
<li>New color-shifting wraps that change in different lighting</li>
<li>Self-healing PPF that fixes minor scratches automatically</li>
<li>Ceramic coatings for ultimate protection</li>
</ul>
<p>Want to see them in person? Stop by the shop - no appointment needed.</p>
<p>- {{shop_name}} Team</p>`,
      },
      {
        delay_hours: 2160, // 90 days
        subject: "Exclusive past customer offer inside",
        preview_text: "Because you're part of the family...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>You're part of the {{shop_name}} family, and we take care of family.</p>
<p>As a past customer, you get priority scheduling and special pricing on any future work.</p>
<p>Whether it's:</p>
<ul>
<li>A fresh wrap for a new ride</li>
<li>PPF to protect your current vehicle</li>
<li>Window tint for summer</li>
</ul>
<p>Just mention this email when you reach out.</p>
<p>See you soon!</p>
<p>- {{shop_name}} Team</p>`,
      },
    ],
  },
  {
    id: "post-install",
    name: "Post-Install Check-In",
    description: "Follow up after installation at 7/30/90 days",
    icon: Heart,
    badge: "Retention",
    badgeVariant: "outline",
    flowType: "post_install",
    steps: [
      {
        delay_hours: 168, // 7 days
        subject: "How's your new wrap looking? 🎉",
        preview_text: "Quick check-in on your recent installation...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>It's been about a week since we finished your {{vehicle}} and I wanted to check in.</p>
<p>How's everything looking? Getting lots of compliments?</p>
<p>Quick care tips:</p>
<ul>
<li>Wait 7 days before washing (you're almost there!)</li>
<li>Hand wash only - no automatic car washes</li>
<li>Park in shade when possible</li>
</ul>
<p>If you notice anything that doesn't look right, let me know ASAP - we stand behind our work 100%.</p>
<p>- {{shop_name}} Team</p>`,
      },
      {
        delay_hours: 720, // 30 days
        subject: "Your 30-day wrap care reminder",
        preview_text: "Time for a quick maintenance check...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>Your wrap is now fully cured and looking amazing (I hope!).</p>
<p>This is a great time to:</p>
<ul>
<li>Give it a proper hand wash with wrap-safe soap</li>
<li>Apply a ceramic boost spray for extra protection</li>
<li>Check edges and seams for any lifting</li>
</ul>
<p>Pro tip: Adding PPF to high-impact areas (front bumper, mirrors, door handles) can extend your wrap's life significantly.</p>
<p>Want us to take a look? Book a free 15-minute inspection.</p>
<p>- {{shop_name}} Team</p>`,
      },
      {
        delay_hours: 2160, // 90 days
        subject: "Love your wrap? Share the love! ❤️",
        preview_text: "Earn rewards for referrals...",
        body_html: `<p>Hey {{customer_name}},</p>
<p>It's been 3 months since we wrapped your {{vehicle}} - time flies!</p>
<p>If you're loving the look, we'd be honored if you:</p>
<ul>
<li>Left us a Google review (helps us grow!)</li>
<li>Shared a photo on Instagram and tagged us</li>
<li>Referred friends or family who might want a wrap</li>
</ul>
<p>Every referral that turns into a job earns you $50 toward your next service with us.</p>
<p>Thanks for being part of the family!</p>
<p>- {{shop_name}} Team</p>`,
      },
    ],
  },
];

export function QuickStartTemplates({ onFlowCreated }: { onFlowCreated?: () => void }) {
  const { organizationId } = useOrganization();
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<Set<string>>(new Set());

  const activateTemplate = async (template: QuickTemplate) => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    setActivating(template.id);

    try {
      // Create the email flow
      const { data: flow, error: flowError } = await supabase
        .from("email_flows")
        .insert({
          organization_id: organizationId,
          name: `${template.name} (Quick Start)`,
          description: template.description,
          flow_type: template.flowType,
          trigger: "manual",
          is_active: true,
          brand: "custom",
        })
        .select()
        .single();

      if (flowError) throw flowError;

      // Create the steps
      const stepsToInsert = template.steps.map((step, index) => ({
        flow_id: flow.id,
        step_number: index + 1,
        delay_hours: step.delay_hours,
        subject: step.subject,
        preview_text: step.preview_text,
        body_html: step.body_html,
        body_text: step.body_html.replace(/<[^>]+>/g, ""),
        ai_generated: false,
      }));

      const { error: stepsError } = await supabase
        .from("email_flow_steps")
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      setActivated((prev) => new Set([...prev, template.id]));
      toast.success(`${template.name} activated!`);
      onFlowCreated?.();
    } catch (error) {
      console.error("Activation error:", error);
      toast.error("Failed to activate template");
    } finally {
      setActivating(null);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          Quick Launch Templates
        </CardTitle>
        <CardDescription>
          One-click pre-built email sequences that start working immediately
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          {QUICK_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isActivated = activated.has(template.id);
            const isLoading = activating === template.id;

            return (
              <div
                key={template.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isActivated
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-muted/50 border-border hover:bg-muted"
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    isActivated ? "bg-green-500/20" : "bg-primary/10"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActivated ? "text-green-500" : "text-primary"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant={template.badgeVariant}>
                      {template.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {template.steps.length} emails
                    </span>
                  </div>
                </div>

                {isActivated ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => activateTemplate(template)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        Activate
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
