import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Shield, Loader2, Sparkles, PhoneForwarded, RefreshCw, Settings2 } from "lucide-react";
import { usePhoneSettings, PhoneSettingsInput } from "@/hooks/usePhoneSettings";
import { PhoneSetupWizard, ConnectionMethod } from "./PhoneSetupWizard";

interface PhoneAgentSettingsProps {
  organizationId: string | null;
}

export function PhoneAgentSettings({ organizationId }: PhoneAgentSettingsProps) {
  const { settings, isLoading, saveSettings, isSaving } = usePhoneSettings(organizationId);
  const [showWizard, setShowWizard] = useState(false);
  
  const [formData, setFormData] = useState<PhoneSettingsInput>({
    twilio_phone_number: "",
    twilio_account_sid: "",
    twilio_auth_token: "",
    alert_phone_number: "",
    alert_email: "",
    company_name: "",
    ai_agent_name: "Jordan",
    greeting_message: "",
    phone_agent_enabled: false,
    sms_alerts_enabled: true,
    connection_method: "new_number",
    original_business_number: "",
    setup_completed: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        twilio_phone_number: settings.twilio_phone_number || "",
        twilio_account_sid: settings.twilio_account_sid || "",
        twilio_auth_token: settings.twilio_auth_token || "",
        alert_phone_number: settings.alert_phone_number || "",
        alert_email: settings.alert_email || "",
        company_name: settings.company_name || "",
        ai_agent_name: settings.ai_agent_name || "Jordan",
        greeting_message: settings.greeting_message || "",
        phone_agent_enabled: settings.phone_agent_enabled || false,
        sms_alerts_enabled: settings.sms_alerts_enabled !== false,
        connection_method: settings.connection_method || "new_number",
        original_business_number: settings.original_business_number || "",
        setup_completed: settings.setup_completed || false,
      });
    }
  }, [settings]);

  const handleWizardComplete = async (data: {
    connectionMethod: ConnectionMethod;
    originalBusinessNumber?: string;
    twilioPhoneNumber?: string;
  }) => {
    await saveSettings({
      ...formData,
      connection_method: data.connectionMethod,
      original_business_number: data.originalBusinessNumber || null,
      twilio_phone_number: data.twilioPhoneNumber || null,
      setup_completed: true,
    });
    setShowWizard(false);
  };

  const getConnectionMethodInfo = () => {
    const method = formData.connection_method || "new_number";
    switch (method) {
      case "new_number":
        return { icon: Sparkles, label: "New Number", color: "text-primary" };
      case "forward_calls":
        return { icon: PhoneForwarded, label: "Call Forwarding", color: "text-amber-500" };
      case "port_number":
        return { icon: RefreshCw, label: "Number Porting", color: "text-blue-500" };
    }
  };

  const handleSave = async () => {
    if (!formData.alert_phone_number) {
      return;
    }
    await saveSettings(formData);
  };

  const previewGreeting = formData.greeting_message || 
    `Hi, thanks for calling ${formData.company_name || "our company"}! I'm ${formData.ai_agent_name || "Jordan"}, our AI assistant. How can I help you today?`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show wizard if setup not completed
  if (showWizard || !formData.setup_completed) {
    return (
      <PhoneSetupWizard
        onComplete={handleWizardComplete}
        onCancel={() => {
          if (formData.setup_completed) {
            setShowWizard(false);
          }
        }}
        assignedPlatformNumber={formData.twilio_phone_number || "+1 (555) 123-4567"}
      />
    );
  }

  const connectionInfo = getConnectionMethodInfo();
  const ConnectionIcon = connectionInfo.icon;

  return (
    <div className="space-y-6">
      {/* Connection Method Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle>Phone Connection</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
              Change Setup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <ConnectionIcon className={`h-8 w-8 ${connectionInfo.color}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{connectionInfo.label}</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              {formData.twilio_phone_number && (
                <p className="text-sm text-muted-foreground mt-1">
                  AI Number: <span className="font-mono">{formData.twilio_phone_number}</span>
                </p>
              )}
              {formData.original_business_number && (
                <p className="text-sm text-muted-foreground">
                  Business Number: <span className="font-mono">{formData.original_business_number}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <CardTitle>Phone Agent Settings</CardTitle>
          </div>
          <CardDescription>
            Configure your AI phone agent to answer calls and route leads to your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable AI Phone Agent</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, incoming calls will be answered by your AI assistant.
              </p>
            </div>
            <Switch
              checked={formData.phone_agent_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, phone_agent_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Twilio Configuration</CardTitle>
          </div>
          <CardDescription>
            Connect your Twilio account or use your assigned platform number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twilio_phone_number">Twilio Phone Number</Label>
            <Input
              id="twilio_phone_number"
              placeholder="+1 (555) 123-4567"
              value={formData.twilio_phone_number || ""}
              onChange={(e) => setFormData({ ...formData, twilio_phone_number: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              The phone number that customers will call.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twilio_account_sid">Account SID (Optional)</Label>
              <Input
                id="twilio_account_sid"
                placeholder="ACxxxxxxx..."
                value={formData.twilio_account_sid || ""}
                onChange={(e) => setFormData({ ...formData, twilio_account_sid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilio_auth_token">Auth Token (Optional)</Label>
              <Input
                id="twilio_auth_token"
                type="password"
                placeholder="••••••••••••"
                value={formData.twilio_auth_token || ""}
                onChange={(e) => setFormData({ ...formData, twilio_auth_token: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave Account SID and Auth Token blank to use the platform's shared Twilio account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Alert Settings</CardTitle>
          </div>
          <CardDescription>
            Configure where to send SMS and email alerts for incoming calls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alert_phone_number">Alert Phone Number *</Label>
            <Input
              id="alert_phone_number"
              placeholder="+1 (555) 987-6543"
              value={formData.alert_phone_number}
              onChange={(e) => setFormData({ ...formData, alert_phone_number: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Where to send SMS notifications for hot leads and urgent calls.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert_email">Alert Email (Optional)</Label>
            <Input
              id="alert_email"
              type="email"
              placeholder="owner@yourshop.com"
              value={formData.alert_email || ""}
              onChange={(e) => setFormData({ ...formData, alert_email: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable SMS Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive instant SMS for hot leads and upset customers.
              </p>
            </div>
            <Switch
              checked={formData.sms_alerts_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, sms_alerts_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Greeting Customization</CardTitle>
          <CardDescription>
            Personalize how your AI assistant greets callers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                placeholder="Your Wrap Shop"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai_agent_name">AI Agent Name</Label>
              <Input
                id="ai_agent_name"
                placeholder="Jordan"
                value={formData.ai_agent_name}
                onChange={(e) => setFormData({ ...formData, ai_agent_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting_message">Custom Greeting (Optional)</Label>
            <Textarea
              id="greeting_message"
              placeholder="Leave blank to use the default greeting..."
              value={formData.greeting_message || ""}
              onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Override the default greeting with your own custom message.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <Label className="text-sm font-medium">Preview</Label>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "{previewGreeting}"
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !formData.alert_phone_number}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
