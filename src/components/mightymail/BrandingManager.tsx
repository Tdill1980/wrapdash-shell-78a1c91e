import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image as ImageIcon } from "lucide-react";

export default function BrandingManager() {
  const [primaryColor, setPrimaryColor] = useState("#00AFFF");
  const [footerText, setFooterText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
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
      setLogoUrl(data.logo_url || "");
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, or SVG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo must be under 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `email-logos/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("design-vault")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("design-vault")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      // Auto-save logo URL
      const { data: existing } = await supabase
        .from("email_branding")
        .select("id")
        .single();

      if (existing) {
        await supabase
          .from("email_branding")
          .update({ logo_url: publicUrl })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_branding").insert({ logo_url: publicUrl });
      }

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Error uploading logo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
        logo_url: logoUrl,
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
          <Label htmlFor="logo-upload">Company Logo</Label>
          <div className="flex gap-4 items-center">
            {logoUrl ? (
              <div className="relative w-32 h-32 rounded-lg border-2 border-[rgba(255,255,255,0.06)] bg-background flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.2)] bg-background flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById("logo-upload")?.click()}
                disabled={uploading}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or SVG • Max 2MB • Recommended: 400x100px
              </p>
            </div>
          </div>
        </div>

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
