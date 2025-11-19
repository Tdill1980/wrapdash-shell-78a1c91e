import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function BrandingManager() {
  const [primaryColor, setPrimaryColor] = useState("#00AFFF");
  const [footerText, setFooterText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBranding();
  }, []);

  async function loadBranding() {
    const { data } = await supabase
      .from("email_branding")
      .select("*")
      .single();

    if (data) {
      setPrimaryColor(data.primary_color || "#00AFFF");
      setFooterText(data.footer_text || "");
      setSenderName(data.sender_name || "");
      setSenderEmail(data.sender_email || "");
    }
  }

  async function saveBranding() {
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("email_branding")
        .select("id")
        .single();

      const brandingData = {
        primary_color: primaryColor,
        footer_text: footerText,
        sender_name: senderName,
        sender_email: senderEmail,
      };

      if (existing) {
        await supabase
          .from("email_branding")
          .update(brandingData)
          .eq("id", existing.id);
      } else {
        await supabase.from("email_branding").insert(brandingData);
      }

      toast({
        title: "Branding Updated",
        description: "Email branding settings saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Error saving branding settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-foreground">Brand & Identity Settings</CardTitle>
        <CardDescription>
          Configure email branding, colors, and sender information for MightyMail campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Brand Color</Label>
          <div className="flex gap-3 items-center">
            <input 
              type="color" 
              id="primary-color"
              className="w-16 h-10 rounded border-0 cursor-pointer" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)} 
            />
            <Input 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-name">Sender Name</Label>
          <Input 
            id="sender-name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="WrapCommand Team"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-email">Sender Email</Label>
          <Input 
            id="sender-email"
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="hello@wrapcommand.com"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer-text">Email Footer Text</Label>
          <Textarea 
            id="footer-text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="© 2025 WrapCommand. All rights reserved."
            className="bg-background min-h-24"
          />
        </div>

        <Button 
          onClick={saveBranding} 
          disabled={saving}
          className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
