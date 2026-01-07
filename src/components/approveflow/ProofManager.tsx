// ============================================
// ProofManager - OS Dashboard for Proof Artifacts
// ============================================
// Controls for viewing, regenerating, and managing proofs.
// Implements versioned artifact system with full audit trail.
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  History, 
  RefreshCw, 
  Trash2, 
  Link2, 
  Send,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatFullDateTime, formatShortDate } from '@/lib/timezone-utils';
import type { ProofStatus, RenderSpecVersion, PdfTemplateVersion } from '@/types/approveflow-os';

interface ProofRevision {
  id: string;
  revision: number;
  status: ProofStatus;
  pdf_url: string | null;
  render_spec_version: RenderSpecVersion;
  pdf_template_version: PdfTemplateVersion;
  created_at: string;
  sent_at: string | null;
}

interface ProofManagerProps {
  projectId: string;
  orderNumber: string;
  currentProofId?: string;
  revisions: ProofRevision[];
  onRegenerateProof: () => void;
  onRefresh: () => void;
  isGenerating?: boolean;
}

const STATUS_CONFIG: Record<ProofStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-600', icon: Send },
  changes_requested: { label: 'Changes Requested', color: 'bg-amber-500/20 text-amber-600', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-600', icon: CheckCircle2 },
  superseded: { label: 'Superseded', color: 'bg-muted text-muted-foreground', icon: History },
};

export function ProofManager({
  projectId,
  orderNumber,
  currentProofId,
  revisions,
  onRegenerateProof,
  onRefresh,
  isGenerating = false,
}: ProofManagerProps) {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const latestRevision = revisions[0];
  const hasProof = revisions.length > 0;

  const handleViewPdf = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/my-approveflow/${orderNumber}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleResendProof = async (proofId: string) => {
    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-approveflow-proof', {
        body: { proof_version_id: proofId },
      });

      if (error) throw error;

      toast({
        title: 'Proof resent!',
        description: 'Customer has been notified via email',
      });
      onRefresh();
    } catch (error) {
      console.error('Error resending proof:', error);
      toast({
        title: 'Resend failed',
        description: 'Could not send proof email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSupersede = async (proofId: string) => {
    try {
      const { error } = await supabase
        .from('approveflow_proof_versions')
        .update({ status: 'superseded' })
        .eq('id', proofId);

      if (error) throw error;

      toast({
        title: 'Proof superseded',
        description: 'This revision has been marked as superseded',
      });
      onRefresh();
    } catch (error) {
      console.error('Error superseding proof:', error);
      toast({
        title: 'Action failed',
        description: 'Could not supersede proof',
        variant: 'destructive',
      });
    }
  };

  if (!hasProof) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium text-foreground">No Proof Generated</p>
              <p className="text-sm text-muted-foreground">
                Generate an approval proof to send to the customer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = STATUS_CONFIG[latestRevision.status].icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Proof Manager
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={STATUS_CONFIG[latestRevision.status].color}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {STATUS_CONFIG[latestRevision.status].label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Proof Info */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Revision {latestRevision.revision}</span>
            <span className="text-xs text-muted-foreground">
              {formatShortDate(latestRevision.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {latestRevision.render_spec_version}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {latestRevision.pdf_template_version}
            </Badge>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!latestRevision.pdf_url}
            onClick={() => latestRevision.pdf_url && handleViewPdf(latestRevision.pdf_url)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View PDF
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopyShareLink}
          >
            {copiedLink ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={onRegenerateProof}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'New Revision'}
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleResendProof(latestRevision.id)}
            disabled={isResending || !latestRevision.pdf_url}
          >
            <Send className={`h-3 w-3 mr-1 ${isResending ? 'animate-pulse' : ''}`} />
            {isResending ? 'Sending...' : 'Resend'}
          </Button>
        </div>

        <Separator />

        {/* Revision History */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              <History className="h-3 w-3 mr-2" />
              View Revision History ({revisions.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Revision History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {revisions.map((revision) => {
                  const RevStatusIcon = STATUS_CONFIG[revision.status].icon;
                  const isCurrent = revision.id === currentProofId;
                  
                  return (
                    <div 
                      key={revision.id}
                      className={`p-3 rounded-lg border ${
                        isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            V{revision.revision}
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${STATUS_CONFIG[revision.status].color}`}
                        >
                          <RevStatusIcon className="h-2.5 w-2.5 mr-1" />
                          {STATUS_CONFIG[revision.status].label}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        Created: {formatFullDateTime(revision.created_at)}
                        {revision.sent_at && (
                          <><br />Sent: {formatFullDateTime(revision.sent_at)}</>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {revision.pdf_url && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleViewPdf(revision.pdf_url!)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                        )}
                        {revision.status !== 'superseded' && revision.status !== 'approved' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleSupersede(revision.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supersede
                          </Button>
                        )}
                        {revision.pdf_url && revision.status !== 'superseded' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleResendProof(revision.id)}
                            disabled={isResending}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
