import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Instagram, Settings, MessageCircle, Zap, Shield, Activity, ExternalLink, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useTradeDNA } from "@/hooks/useTradeDNA";
import { useToast } from "@/hooks/use-toast";

const InstagramBot = () => {
  const { tradeDNA } = useTradeDNA();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'active' | 'inactive' | 'error'>('inactive');

  // Simulated stats
  const stats = {
    messagesReceived: 127,
    autoReplies: 98,
    leadsCapture: 34,
    quotesGenerated: 12,
    escalations: 8
  };

  const handleConnectInstagram = () => {
    // This would open Meta's OAuth flow
    toast({
      title: "Instagram Connection",
      description: "Opening Meta Business Suite for authentication..."
    });
    // window.open('https://business.facebook.com/latest/inbox/settings', '_blank');
    
    // Simulate connection for demo
    setTimeout(() => {
      setIsConnected(true);
      setWebhookStatus('active');
      toast({
        title: "Connected!",
        description: "Instagram account linked successfully"
      });
    }, 2000);
  };

  const handleToggleBot = (enabled: boolean) => {
    setIsBotEnabled(enabled);
    toast({
      title: enabled ? "Bot Enabled" : "Bot Disabled",
      description: enabled 
        ? "AI will now respond to Instagram DMs automatically"
        : "Automatic responses are paused"
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-foreground">Instagram</span>
                <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent"> Bot</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered DM automation using TradeDNA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="flex items-center gap-2">
                <Switch
                  id="bot-toggle"
                  checked={isBotEnabled}
                  onCheckedChange={handleToggleBot}
                />
                <Label htmlFor="bot-toggle">Bot {isBotEnabled ? 'ON' : 'OFF'}</Label>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] mb-4">
                <Instagram className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Instagram</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Link your Instagram Business account to enable AI-powered DM automation. 
                The bot will use your TradeDNA profile to respond in your brand voice.
              </p>
              <Button size="lg" onClick={handleConnectInstagram}>
                <Instagram className="w-5 h-5 mr-2" />
                Connect Instagram Account
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Requires Instagram Business or Creator account with Meta Business Suite
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Connection Status Banner */}
            <Alert className="border-green-500/50 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-600">Connected to Instagram</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>@{tradeDNA?.instagram_handle || 'your_business'} is linked and receiving messages</span>
                <div className="flex items-center gap-2">
                  <Badge variant={webhookStatus === 'active' ? 'default' : 'destructive'}>
                    Webhook: {webhookStatus}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.messagesReceived}</div>
                  <p className="text-xs text-muted-foreground">Messages Received</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">{stats.autoReplies}</div>
                  <p className="text-xs text-muted-foreground">Auto Replies</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-500">{stats.leadsCapture}</div>
                  <p className="text-xs text-muted-foreground">Leads Captured</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-500">{stats.quotesGenerated}</div>
                  <p className="text-xs text-muted-foreground">Quotes Generated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-500">{stats.escalations}</div>
                  <p className="text-xs text-muted-foreground">Escalations</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Settings */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Bot Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize how the AI responds to different message types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="triggers" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="triggers">Triggers</TabsTrigger>
                      <TabsTrigger value="behavior">Behavior</TabsTrigger>
                      <TabsTrigger value="escalation">Escalation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="triggers" className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Quote Requests</p>
                            <p className="text-sm text-muted-foreground">
                              Keywords: "price", "cost", "quote", "how much"
                            </p>
                          </div>
                          <Badge>Quote Flow</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Design Inquiries</p>
                            <p className="text-sm text-muted-foreground">
                              Keywords: "design", "color", "wrap", "mockup"
                            </p>
                          </div>
                          <Badge variant="secondary">Design Flow</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Order Support</p>
                            <p className="text-sm text-muted-foreground">
                              Keywords: "status", "order", "tracking", "where is"
                            </p>
                          </div>
                          <Badge variant="outline">Support Flow</Badge>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="behavior" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-respond to new messages</Label>
                            <p className="text-sm text-muted-foreground">
                              Send instant reply to first-time contacts
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Ask for vehicle info first</Label>
                            <p className="text-sm text-muted-foreground">
                              Always collect year/make/model early
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Request photos automatically</Label>
                            <p className="text-sm text-muted-foreground">
                              Ask for vehicle photos during quote flow
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Use TradeDNA voice</Label>
                            <p className="text-sm text-muted-foreground">
                              Responses match your brand personality
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="escalation" className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Escalation Keywords</Label>
                          <Input 
                            placeholder="human, person, manager, call me..."
                            defaultValue="human, person, manager, speak to, call me"
                          />
                          <p className="text-xs text-muted-foreground">
                            Messages containing these words will be escalated
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Escalation Message</Label>
                          <Input 
                            placeholder="Let me connect you with..."
                            defaultValue="Let me connect you with a specialist who can help with that right away."
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-escalate after 3 failed matches</Label>
                            <p className="text-sm text-muted-foreground">
                              If AI can't understand intent 3 times
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Activity Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { user: '@car_lover', action: 'Quote flow started', time: '2m ago', type: 'quote' },
                      { user: '@fleet_manager', action: 'Lead captured', time: '15m ago', type: 'lead' },
                      { user: '@wrap_fan', action: 'Escalated to human', time: '32m ago', type: 'escalate' },
                      { user: '@truck_wraps', action: 'Auto-replied', time: '1h ago', type: 'reply' },
                      { user: '@design_curious', action: 'Design flow started', time: '2h ago', type: 'design' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.type === 'quote' ? 'bg-green-500' :
                            item.type === 'lead' ? 'bg-blue-500' :
                            item.type === 'escalate' ? 'bg-orange-500' :
                            item.type === 'design' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{item.user}</p>
                            <p className="text-xs text-muted-foreground">{item.action}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4" size="sm">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default InstagramBot;