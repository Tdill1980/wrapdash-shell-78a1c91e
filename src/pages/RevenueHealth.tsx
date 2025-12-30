import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  Mail, 
  MessageSquare,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Eye,
  ChevronRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface HealthStatus {
  campaign_status: 'healthy' | 'warning' | 'critical' | 'emergency';
  signal_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  overall_status: 'green' | 'yellow' | 'red';
  days_since_email: number;
  days_since_sms: number;
  signal_freshness_score: number;
  requires_action: boolean;
  alerts: string[];
  recommended_actions: string[];
}

interface RecoveryCampaign {
  id?: string;
  subject_line: string;
  preview_text: string;
  email_html: string;
  sms_copy: string;
  suggested_segments: string[];
  meta_ad_copy: string;
  status?: string;
}

export default function RevenueHealth() {
  const queryClient = useQueryClient();
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideType, setOverrideType] = useState("");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // Fetch health status
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['revenue-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('revenue-health-monitor', {
        body: { action: 'check_health' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Check every minute
  });

  // Fetch pending recovery campaigns
  const { data: pendingCampaigns } = useQuery({
    queryKey: ['recovery-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_recovery_campaigns')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RecoveryCampaign[];
    },
  });

  // Fetch recent campaigns sent
  const { data: recentCampaigns } = useQuery({
    queryKey: ['recent-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_heartbeat')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Generate recovery campaign mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('revenue-health-monitor', {
        body: { action: 'generate_recovery' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Recovery campaign generated!');
      queryClient.invalidateQueries({ queryKey: ['recovery-campaigns'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to generate: ${error.message}`);
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaign: RecoveryCampaign) => {
      // Call create-klaviyo-campaign to send
      const { data, error } = await supabase.functions.invoke('create-klaviyo-campaign', {
        body: {
          campaignType: 'winback',
          name: `Recovery: ${campaign.subject_line}`,
          subject: campaign.subject_line,
          previewText: campaign.preview_text,
          html: campaign.email_html,
          segmentType: '30_day_inactive'
        }
      });
      if (error) throw error;
      
      // Update campaign status
      if (campaign.id) {
        await supabase
          .from('auto_recovery_campaigns')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', campaign.id);
      }
      
      // Log to heartbeat
      await supabase.functions.invoke('revenue-health-monitor', {
        body: {
          action: 'log_campaign',
          campaignType: 'email',
          campaignName: `Recovery: ${campaign.subject_line}`,
          campaignSource: 'mightymail'
        }
      });
      
      return data;
    },
    onSuccess: () => {
      toast.success('Campaign sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['recovery-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-health'] });
      queryClient.invalidateQueries({ queryKey: ['recent-campaigns'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to send: ${error.message}`);
    }
  });

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('revenue-health-monitor', {
        body: {
          action: 'log_override',
          overrideType,
          overrideReason,
          userName: 'Admin',
          warningLevel: health?.campaign_status,
          daysSince: health?.days_since_email
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Override logged');
      setShowOverrideDialog(false);
      setOverrideReason("");
    }
  });

  const health = healthData?.health as HealthStatus | undefined;
  const recoveryCampaign = healthData?.recovery_campaign as RecoveryCampaign | undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'yellow':
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'red':
      case 'critical':
      case 'emergency':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'yellow':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'red':
      case 'critical':
      case 'emergency':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <MainLayout userName="Admin">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="text-white">Revenue</span>
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"> Flywheel</span>
            </h2>
            <p className="text-muted-foreground">
              AI-enforced guardrails to ensure campaigns never stall and signals never decay
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status Banner */}
        {health && (
          <div className={`p-6 rounded-xl border-2 ${
            health.overall_status === 'red' 
              ? 'bg-red-500/10 border-red-500/50' 
              : health.overall_status === 'yellow'
              ? 'bg-yellow-500/10 border-yellow-500/50'
              : 'bg-green-500/10 border-green-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(health.overall_status)}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {health.overall_status === 'green' && "All Systems Healthy"}
                    {health.overall_status === 'yellow' && "Attention Required"}
                    {health.overall_status === 'red' && "🚨 CRITICAL: Revenue at Risk"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {health.requires_action 
                      ? "Take action now to prevent revenue loss"
                      : "Your revenue flywheel is spinning smoothly"}
                  </p>
                </div>
              </div>
              {health.requires_action && (
                <Button 
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Recovery Campaign
                </Button>
              )}
            </div>

            {/* Alerts */}
            {health.alerts.length > 0 && (
              <div className="mt-4 space-y-2">
                {health.alerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="h-4 w-4" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Module 1: Campaign Heartbeat */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Campaign Heartbeat
                </CardTitle>
                <Badge className={getStatusColor(health?.campaign_status || 'unknown')}>
                  {health?.campaign_status?.toUpperCase() || 'LOADING'}
                </Badge>
              </div>
              <CardDescription>Track outbound activation cadence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Days Since Email</span>
                  <span className={`font-bold ${
                    (health?.days_since_email || 0) >= 10 ? 'text-red-400' :
                    (health?.days_since_email || 0) >= 7 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {health?.days_since_email ?? '—'} days
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, ((health?.days_since_email || 0) / 14) * 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Days Since SMS</span>
                  <span className="font-bold text-muted-foreground">
                    {health?.days_since_sms ?? '—'} days
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, ((health?.days_since_sms || 0) / 14) * 100)} 
                  className="h-2"
                />
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Rules:</strong> Warning at 7 days • Critical at 10 days • Emergency at 14 days
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Module 2: Signal Health */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Klaviyo → Meta Signals
                </CardTitle>
                <Badge className={getStatusColor(health?.signal_status || 'unknown')}>
                  {health?.signal_status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
              <CardDescription>Advantage+ Shopping signal health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Signal Freshness</span>
                  <span className={`font-bold ${
                    (health?.signal_freshness_score || 0) >= 80 ? 'text-green-400' :
                    (health?.signal_freshness_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {health?.signal_freshness_score ?? 0}/100
                  </span>
                </div>
                <Progress 
                  value={health?.signal_freshness_score || 0} 
                  className="h-2"
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Synced Segments:</p>
                <div className="flex flex-wrap gap-1">
                  {['Highly Engaged', 'High Intent', 'Past Purchasers'].map(seg => (
                    <Badge key={seg} variant="outline" className="text-xs">
                      {seg}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Rules:</strong> Warning at 48h stale • Critical at 72h stale
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Module 5: Accountability Lock */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Accountability Lock
                </CardTitle>
                {health?.requires_action && (
                  <Badge className="bg-red-500/20 text-red-400">LOCKED</Badge>
                )}
              </div>
              <CardDescription>Budget increase guardrail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {health?.requires_action ? (
                <>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-400">
                      ⛔ Meta budget increases are BLOCKED until a campaign is sent
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setOverrideType('budget_increase');
                      setShowOverrideDialog(true);
                    }}
                  >
                    Request Override (Logged)
                  </Button>
                </>
              ) : (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-green-400">
                    ✅ All systems healthy — budget increases allowed
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Blocked:</strong> Budget increases • New Advantage+ campaigns • Boosted posts
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module 4: Auto-Recovery Engine */}
        {(pendingCampaigns?.length > 0 || recoveryCampaign) && (
          <Card className="border-2 border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Auto-Recovery Campaign Ready
              </CardTitle>
              <CardDescription>
                AI-generated campaign to re-engage your audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(pendingCampaigns?.[0] || recoveryCampaign) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
                      <p className="text-lg font-medium">
                        {pendingCampaigns?.[0]?.subject_line || recoveryCampaign?.subject_line}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Preview Text</label>
                      <p className="text-sm text-muted-foreground">
                        {pendingCampaigns?.[0]?.preview_text || recoveryCampaign?.preview_text}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Suggested Segments</label>
                    <div className="flex gap-2">
                      {(pendingCampaigns?.[0]?.suggested_segments || recoveryCampaign?.suggested_segments || []).map((seg: string) => (
                        <Badge key={seg} variant="outline">{seg}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">SMS Copy</label>
                    <p className="text-sm p-3 rounded bg-muted/50">
                      {pendingCampaigns?.[0]?.sms_copy || recoveryCampaign?.sms_copy}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                      onClick={() => sendCampaignMutation.mutate(pendingCampaigns?.[0] || recoveryCampaign!)}
                      disabled={sendCampaignMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendCampaignMutation.isPending ? 'Sending...' : 'Approve & Send Now'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setPreviewHtml(pendingCampaigns?.[0]?.email_html || recoveryCampaign?.email_html || '');
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Email
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Campaigns */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Last 10 outbound activations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCampaigns?.length > 0 ? (
              <div className="space-y-2">
                {recentCampaigns.map((campaign: any) => (
                  <div 
                    key={campaign.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {campaign.campaign_type === 'email' ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.campaign_source} • {campaign.audience_size || '—'} recipients
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(campaign.sent_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.opened_count || 0} opens • {campaign.clicked_count || 0} clicks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No campaigns logged yet. Send your first campaign to start tracking!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Override Dialog */}
        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Override</DialogTitle>
              <DialogDescription>
                This action will be logged for accountability. Please provide a reason.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Why are you overriding this guardrail?"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => overrideMutation.mutate()}
                disabled={!overrideReason.trim() || overrideMutation.isPending}
              >
                Log Override & Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
            </DialogHeader>
            <div 
              className="border rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
