import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Mail, 
  Receipt, 
  FileCheck,
  Loader2
} from "lucide-react";
import { 
  type EscalationStatusResult, 
  getStatusLabel, 
  getStatusColor 
} from "@/hooks/useEscalationStatus";

interface EscalationStatusCardProps {
  statusResult: EscalationStatusResult;
  onMarkComplete: () => void;
  onDismissQuote: () => void;
  onMarkFileReviewed: () => void;
  isLoading?: boolean;
}

export function EscalationStatusCard({ 
  statusResult, 
  onMarkComplete,
  onDismissQuote,
  onMarkFileReviewed,
  isLoading 
}: EscalationStatusCardProps) {
  const { status, missing, hasEscalation, requirements, canMarkComplete } = statusResult;

  if (!hasEscalation) {
    return null;
  }

  const statusIcon = {
    open: <Clock className="h-4 w-4" />,
    blocked: <XCircle className="h-4 w-4" />,
    complete: <CheckCircle className="h-4 w-4" />,
  }[status];

  return (
    <Card className={`border-2 ${getStatusColor(status)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Escalation Status
          </div>
          <Badge variant="outline" className={getStatusColor(status)}>
            {statusIcon}
            <span className="ml-1">{getStatusLabel(status)}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Requirements Checklist */}
        <div className="space-y-2">
          <RequirementRow 
            label="Email Sent" 
            met={requirements.emailSent}
            icon={<Mail className="h-3.5 w-3.5" />}
          />
          <RequirementRow 
            label="Quote Handled" 
            met={requirements.quoteHandled}
            icon={<Receipt className="h-3.5 w-3.5" />}
            action={!requirements.quoteHandled ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs px-2"
                onClick={onDismissQuote}
                disabled={isLoading}
              >
                Not Needed
              </Button>
            ) : undefined}
          />
          <RequirementRow 
            label="Files Reviewed" 
            met={requirements.filesReviewed}
            icon={<FileCheck className="h-3.5 w-3.5" />}
            action={!requirements.filesReviewed ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs px-2"
                onClick={onMarkFileReviewed}
                disabled={isLoading}
              >
                Mark Reviewed
              </Button>
            ) : undefined}
          />
        </div>

        {/* Missing Requirements */}
        {missing.length > 0 && status !== 'complete' && (
          <div className="p-2 bg-red-500/5 rounded-md border border-red-500/20">
            <p className="text-xs font-medium text-red-500 mb-1">Cannot Complete:</p>
            <ul className="text-xs text-red-400 space-y-0.5">
              {missing.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mark Complete Button */}
        {status !== 'complete' && (
          <Button 
            className="w-full" 
            size="sm"
            disabled={!canMarkComplete || isLoading}
            onClick={onMarkComplete}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : canMarkComplete ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Requirements Not Met
              </>
            )}
          </Button>
        )}

        {status === 'complete' && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-green-500 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Escalation Resolved</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RequirementRow({ 
  label, 
  met, 
  icon,
  action 
}: { 
  label: string; 
  met: boolean; 
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {met ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className={met ? 'text-muted-foreground' : 'text-foreground font-medium'}>
          {icon}
        </span>
        <span className={met ? 'text-muted-foreground' : 'text-foreground'}>
          {label}
        </span>
      </div>
      {action}
    </div>
  );
}
