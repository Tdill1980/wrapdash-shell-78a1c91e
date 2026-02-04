import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { 
  Mail, 
  Send, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";

interface WinbackSequence {
  id: string;
  sequence_name: string;
  trigger_days_inactive: number;
  emails_in_sequence: number;
  is_active: boolean;
  total_revenue: number;
  conversion_rate: number;
  last_run_at: string | null;
}

interface KlaviyoCampaign {
  id: string;
  name: string;
  subject: string;
  campaign_type: string;
  segment_type: string;
  status: string;
  sent_at: string | null;
  opened_count: number;
  clicked_count: number;
  revenue_attributed: number;
  offer_type: string;
  offer_value: number;
  created_at: string;
}

// Klaviyo segment IDs - update these with your real IDs
const KLAVIYO_SEGMENTS: Record<string, string> = {
  "30_day_inactive": "", // Add your Klaviyo segment ID
  "60_day_inactive": "", // Add your Klaviyo segment ID  
  "90_day_inactive": "", // Add your Klaviyo segment ID
};

export default function MightyMailWinback() {
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState("30_day_inactive");
  const [segmentId, setSegmentId] = useState(""); // Direct Klaviyo segment ID input
  const [offerType, setOfferType] = useState<string>("percent_off");
  const [offerValue, setOfferValue] = useState([10]);
  const [urgencyLevel, setUrgencyLevel] = useState("soft");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Fetch winback sequences
  const { data: sequences = [], isLoading: loadingSequences } = useQuery({
    queryKey: ['winback-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('winback_sequences')
        .select('*')
        .order('trigger_days_inactive', { ascending: true });
      if (error) throw error;
      return data as WinbackSequence[];
    }
  });

  // Fetch recent campaigns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['klaviyo-campaigns', 'winback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('klaviyo_campaigns')
        .select('*')
        .eq('campaign_type', 'winback')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as KlaviyoCampaign[];
    }
  });

  // Generate AI email
  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const inactivityDays = selectedSegment === "30_day_inactive" ? 30 
        : selectedSegment === "60_day_inactive" ? 60 
        : 90;

      const { data, error } = await lovableFunctions.functions.invoke('ai-generate-winback-email', {
        body: {
          inactivityDays,
          offerType,
          offerValue: offerValue[0],
          urgencyLevel,
          emailNumber: 1,
          customerFirstName: '{{first_name|default:"there"}}'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setPreviewHtml(data.html);
      setGeneratedContent(data.content);
      toast.success("Email generated successfully!");
    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error(err.message || "Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  // Send campaign
  const sendCampaign = async () => {
    if (!previewHtml || !generatedContent) {
      toast.error("Please generate an email first");
      return;
    }

    // Get the segment ID - either from direct input or from the mapping
    const klaviyoSegmentId = segmentId || KLAVIYO_SEGMENTS[selectedSegment];
    
    if (!klaviyoSegmentId) {
      toast.error("Please enter a Klaviyo Segment ID");
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[Klaviyo] Sending campaign with segmentId:', klaviyoSegmentId);
      
      const { data, error } = await lovableFunctions.functions.invoke('create-klaviyo-campaign', {
        body: {
          campaignType: 'winback',
          name: `WinBack ${selectedSegment} - ${new Date().toLocaleDateString()}`,
          subject: generatedContent.subject,
          previewText: generatedContent.preheader,
          html: previewHtml,
          segmentId: klaviyoSegmentId, // Pass actual Klaviyo segment ID
          segmentType: selectedSegment,
          offerType,
          offerValue: offerValue[0]
        }
      });

      if (error) {
        console.error('[Klaviyo] Edge function error:', error);
        throw error;
      }
      
      if (!data?.success) {
        console.error('[Klaviyo] Campaign creation failed:', data);
        throw new Error(data?.error || "Campaign creation failed");
      }

      console.log('[Klaviyo] Campaign created:', data);
      toast.success(data.message || "Campaign created successfully!");
      queryClient.invalidateQueries({ queryKey: ['klaviyo-campaigns'] });
      
      // Reset preview
      setPreviewHtml(null);
      setGeneratedContent(null);
    } catch (err: any) {
      console.error('[Klaviyo] Send error:', err);
      toast.error(err.message || "Failed to send campaign");
    } finally {
      setIsGenerating(false);
    }
  };

  const segmentStats = {
    "30_day_inactive": { size: 847, label: "30 Days Inactive" },
    "60_day_inactive": { size: 423, label: "60 Days Inactive" },
    "90_day_inactive": { size: 215, label: "90+ Days Inactive" }
  };

  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0);
  const totalSent = campaigns.filter(c => c.status === 'sent').length;
  const avgOpenRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) / Math.max(campaigns.length, 1)
    : 0;

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-white">Mighty</span>
              <span className="bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">WinBack</span>
              <span className="text-xs text-muted-foreground ml-2">AI-Powered</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Recover lapsed customers with AI-generated, high-converting emails
            </p>
          </div>
          <Badge variant="secondary" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Klaviyo Integration
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue Recovered</p>
                  <p className="text-2xl font-bold text-pink-400">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Send className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Campaigns Sent</p>
                  <p className="text-2xl font-bold text-yellow-400">{totalSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Lapsed</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {Object.values(segmentStats).reduce((s, v) => s + v.size, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Open Rate</p>
                  <p className="text-2xl font-bold text-green-400">{avgOpenRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="create" className="space-y-4">
          <TabsList className="bg-background/50 border">
            <TabsTrigger value="create" className="data-[state=active]:bg-pink-500/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger value="sequences" className="data-[state=active]:bg-yellow-500/20">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sequences
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Campaign History
            </TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Campaign Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your AI-powered winback email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Target Segment */}
                  <div className="space-y-2">
                    <Label>Target Segment</Label>
                    <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(segmentStats).map(([key, val]) => (
                          <SelectItem key={key} value={key}>
                            {val.label} ({val.size} customers)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Klaviyo Segment ID */}
                  <div className="space-y-2">
                    <Label>Klaviyo Segment ID</Label>
                    <Input 
                      placeholder="e.g. WYbqVX"
                      value={segmentId}
                      onChange={(e) => setSegmentId(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find this in Klaviyo → Audience → Segments → Select segment → Copy ID from URL
                    </p>
                  </div>

                  {/* Offer Type */}
                  <div className="space-y-2">
                    <Label>Offer Type</Label>
                    <Select value={offerType} onValueChange={setOfferType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent_off">Percentage Off</SelectItem>
                        <SelectItem value="dollar_off">Dollar Amount Off</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                        <SelectItem value="bundle">Bundle Deal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Offer Value */}
                  <div className="space-y-2">
                    <Label>
                      Offer Value: {offerType === 'percent_off' ? `${offerValue[0]}%` : `$${offerValue[0]}`}
                    </Label>
                    <Slider
                      value={offerValue}
                      onValueChange={setOfferValue}
                      min={5}
                      max={offerType === 'percent_off' ? 50 : 200}
                      step={5}
                      className="py-4"
                    />
                  </div>

                  {/* Urgency Level */}
                  <div className="space-y-2">
                    <Label>Urgency Level</Label>
                    <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soft">Soft (Friendly reconnection)</SelectItem>
                        <SelectItem value="medium">Medium (FOMO + urgency)</SelectItem>
                        <SelectItem value="aggressive">Aggressive (Final chance)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate Button */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={generateEmail} 
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Generate Email
                    </Button>
                    
                    {previewHtml && (
                      <Button 
                        onClick={sendCampaign}
                        disabled={isGenerating}
                        variant="outline"
                        className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    Email Preview
                  </CardTitle>
                  <CardDescription>
                    {generatedContent 
                      ? `Subject: ${generatedContent.subject}`
                      : "Generate an email to see the preview"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previewHtml ? (
                    <div className="border rounded-lg overflow-hidden bg-[#0A0A0A]">
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-[500px]"
                        title="Email Preview"
                      />
                    </div>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center border border-dashed rounded-lg bg-muted/5">
                      <div className="text-center text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Configure options and click "Generate Email"</p>
                        <p className="text-sm">to preview your AI-generated winback email</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sequences.map((seq) => (
                <Card key={seq.id} className={seq.is_active ? "border-green-500/30" : "border-muted"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{seq.sequence_name}</CardTitle>
                      <Badge variant={seq.is_active ? "default" : "secondary"}>
                        {seq.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Triggers after {seq.trigger_days_inactive} days inactive
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Emails in sequence</span>
                        <span>{seq.emails_in_sequence}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total revenue</span>
                        <span className="text-green-400">${seq.total_revenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion rate</span>
                        <span>{(seq.conversion_rate || 0).toFixed(1)}%</span>
                      </div>
                      {seq.last_run_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last run</span>
                          <span>{new Date(seq.last_run_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent WinBack Campaigns</CardTitle>
                <CardDescription>
                  View performance of your AI-generated winback campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No winback campaigns yet</p>
                    <p className="text-sm">Generate and send your first campaign above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div 
                        key={campaign.id} 
                        className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
                      >
                        <div className="flex items-center gap-3">
                          {campaign.status === 'sent' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : campaign.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">Opens</p>
                            <p className="font-medium">{campaign.opened_count || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Clicks</p>
                            <p className="font-medium">{campaign.clicked_count || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-medium text-green-400">
                              ${(campaign.revenue_attributed || 0).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' :
                            campaign.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
