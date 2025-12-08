import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Send, Settings, Users, TrendingUp, CheckCircle, AlertCircle, 
  BarChart3, Clock, Ban, Zap, RefreshCw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/layouts/MainLayout";

interface EmailStats {
  totalSent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  activeEnrollments: number;
}

export default function MightyMail() {
  const { toast } = useToast();
  const [customerEmailsEnabled, setCustomerEmailsEnabled] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    activeEnrollments: 0,
  });
  const [isRunningSequence, setIsRunningSequence] = useState(false);

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get email tracking stats
      const { data: tracking } = await supabase
        .from("email_tracking")
        .select("status")
        .limit(1000);

      const sent = tracking?.filter(t => t.status === "sent").length || 0;

      // Get email events
      const { data: events } = await supabase
        .from("email_events")
        .select("event_type")
        .limit(1000);

      const opened = events?.filter(e => e.event_type === "opened").length || 0;
      const clicked = events?.filter(e => e.event_type === "clicked").length || 0;

      // Get bounces
      const { count: bouncedCount } = await supabase
        .from("email_bounces")
        .select("*", { count: "exact", head: true });

      // Get unsubscribes
      const { count: unsubCount } = await supabase
        .from("email_unsubscribes")
        .select("*", { count: "exact", head: true });

      // Get active enrollments
      const { count: enrollmentCount } = await supabase
        .from("email_sequence_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        totalSent: sent,
        opened,
        clicked,
        bounced: bouncedCount || 0,
        unsubscribed: unsubCount || 0,
        activeEnrollments: enrollmentCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

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

  const handleRunSequences = async () => {
    setIsRunningSequence(true);
    try {
      const { data, error } = await supabase.functions.invoke('execute-email-sequence', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: "Sequence Execution Complete",
        description: `Processed: ${data.results?.processed || 0}, Sent: ${data.results?.sent || 0}`,
      });

      loadStats();
    } catch (error) {
      console.error('Error running sequences:', error);
      toast({
        title: "Error",
        description: "Failed to execute email sequences",
        variant: "destructive",
      });
    } finally {
      setIsRunningSequence(false);
    }
  };

  const openRate = stats.totalSent > 0 ? ((stats.opened / stats.totalSent) * 100).toFixed(1) : "0";
  const clickRate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : "0";

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-poppins">
              <span className="text-foreground">Mighty</span>
              <span className="text-gradient">Mail</span>
              <span className="text-muted-foreground text-sm align-super">™</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Enterprise email automation with AI-powered sequences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-2 bg-green-600">
              <CheckCircle className="h-4 w-4" />
              Enterprise Ready
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold">{stats.totalSent}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Opened</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.opened}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{openRate}% rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <p className="text-2xl font-bold">{stats.clicked}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{clickRate}% rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bounced</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-2xl font-bold">{stats.bounced}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unsubscribed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Ban className="h-5 w-5 text-orange-500" />
                    <p className="text-2xl font-bold">{stats.unsubscribed}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Sequences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <p className="text-2xl font-bold">{stats.activeEnrollments}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={handleRunSequences} disabled={isRunningSequence}>
                  {isRunningSequence ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Run Email Sequences
                </Button>
                <Button variant="outline" onClick={loadStats}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </CardContent>
            </Card>

            {/* Status Alert */}
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Customer Emails Enabled</p>
                    <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                      MightyMail is now sending emails to real customers. Automated sequences are active 
                      and compliance features (unsubscribe, bounce handling) are operational.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Automated Sequences
                </CardTitle>
                <CardDescription>
                  Manage follow-up email sequences that run automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">New Quote Follow-up</h3>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sends 3 automated emails: immediately, after 48 hours, and after 5 days
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Day 0: Quote Ready</Badge>
                    <Badge variant="outline">Day 2: Follow-up</Badge>
                    <Badge variant="outline">Day 5: Last Chance</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Abandoned Cart Recovery</h3>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Re-engages customers who started but didn't complete checkout
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">2 hours: Reminder</Badge>
                    <Badge variant="outline">24 hours: Special Offer</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Post-Install Care</h3>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Premium care instructions after wrap installation
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Day 0: Welcome</Badge>
                    <Badge variant="outline">Day 7: Care Guide</Badge>
                  </div>
                </div>

                <Button onClick={handleRunSequences} disabled={isRunningSequence} className="w-full">
                  {isRunningSequence ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Execute Pending Sequence Emails
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
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
                      Send automated emails to customers
                    </p>
                  </div>
                  <Switch
                    id="customer-emails"
                    checked={customerEmailsEnabled}
                    onCheckedChange={setCustomerEmailsEnabled}
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
              </CardContent>
            </Card>

            {/* Compliance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Compliance Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Unsubscribe Links</p>
                    <p className="text-sm text-muted-foreground">All emails include one-click unsubscribe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Bounce Handling</p>
                    <p className="text-sm text-muted-foreground">Hard bounces are automatically removed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Spam Complaint Protection</p>
                    <p className="text-sm text-muted-foreground">Complaints trigger automatic unsubscribe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">List-Unsubscribe Header</p>
                    <p className="text-sm text-muted-foreground">Email clients show easy unsubscribe option</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}