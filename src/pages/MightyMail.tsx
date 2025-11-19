import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Settings, Users, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function MightyMail() {
  const { toast } = useToast();
  const [customerEmailsEnabled, setCustomerEmailsEnabled] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState("");

  const emailCampaigns = [
    {
      id: 'customer_welcome',
      name: 'Customer Welcome',
      description: 'Sent when a new ApproveFlow project is created',
      event: 'approveflow_customer_welcome',
      status: 'active',
      recipients: 156,
    },
    {
      id: 'proof_ready',
      name: 'Proof Ready',
      description: 'Sent when designer uploads a new proof',
      event: 'approveflow_proof_delivered',
      status: 'active',
      recipients: 203,
    },
    {
      id: 'design_approved',
      name: 'Design Approved',
      description: 'Confirmation when customer approves design',
      event: 'approveflow_design_approved',
      status: 'active',
      recipients: 178,
    },
    {
      id: 'shipping_notification',
      name: 'Shipping Notification',
      description: 'Sent when order ships with tracking info',
      event: 'shopflow_order_shipped',
      status: 'active',
      recipients: 145,
    },
    {
      id: '3d_render_ready',
      name: '3D Render Ready',
      description: 'Sent when 3D renders are generated',
      event: 'approveflow_3d_render_ready',
      status: 'active',
      recipients: 89,
    },
  ];

  const handleSendTest = async (campaign: typeof emailCampaigns[0]) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-mightymail-test', {
        body: {
          testEmail: testEmail,
          campaignName: campaign.name,
          campaignEvent: campaign.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${testEmail} via Resend`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full px-10 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">
            <span className="text-foreground">Mighty</span>
            <span className="text-gradient">Mail</span>
            <span className="text-muted-foreground text-sm align-super">™</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage email campaigns and customer notifications via Resend
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          Klaviyo Integration
        </Badge>
      </div>

      {/* Settings Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Configure email campaign settings and testing options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="customer-emails" className="text-base font-medium">
                Customer Emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable sending emails to customers (currently disabled for testing)
              </p>
            </div>
            <Switch
              id="customer-emails"
              checked={customerEmailsEnabled}
              onCheckedChange={setCustomerEmailsEnabled}
              disabled
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="test-mode" className="text-base font-medium">
                Test Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                All emails will be sent to the test address below
              </p>
            </div>
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>

          {testMode && (
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                All test emails will be sent to this address
              </p>
            </div>
          )}

          <div className="bg-amber-500/10 border-amber-500/20 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Testing Mode Active</p>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  Customer emails are currently disabled. Enable them in production once testing is complete.
                  Update the <code className="bg-amber-500/20 px-1 py-0.5 rounded">SEND_CUSTOMER_EMAILS</code> flag 
                  in <code className="bg-amber-500/20 px-1 py-0.5 rounded">src/lib/approveflow-helpers.ts</code> to go live.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              <p className="text-3xl font-bold">{emailCampaigns.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <p className="text-3xl font-bold">
                {emailCampaigns.reduce((sum, c) => sum + c.recipients, 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <p className="text-3xl font-bold">
                {emailCampaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
          <CardDescription>
            Automated email campaigns triggered by system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Event: <code className="bg-muted px-1 py-0.5 rounded">{campaign.event}</code>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recipients: {campaign.recipients}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendTest(campaign)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Klaviyo Link */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configure in Klaviyo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            These events are being sent to Klaviyo. You'll need to create email templates and flows 
            in your Klaviyo dashboard to handle these events.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open('https://www.klaviyo.com/flows', '_blank')}
          >
            Open Klaviyo Flows
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
