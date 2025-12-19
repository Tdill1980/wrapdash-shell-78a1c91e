import { EnrichedOpsTask } from "@/hooks/useOpsTaskEnrichment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Instagram, 
  Mail,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";

interface OpsTaskDetailCardProps {
  task: EnrichedOpsTask;
  onApprove: () => void;
  onReject: () => void;
  onReroute: () => void;
}

const INBOX_COLORS: Record<string, string> = {
  design: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40',
  hello: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40',
  jackson: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40'
};

export function OpsTaskDetailCard({ task, onApprove, onReject, onReroute }: OpsTaskDetailCardProps) {
  const ChannelIcon = task.channel === 'instagram' ? Instagram : Mail;
  const channelColor = task.channel === 'instagram' 
    ? 'text-pink-600 bg-pink-100 dark:bg-pink-900/40' 
    : 'text-blue-600 bg-blue-100 dark:bg-blue-900/40';

  return (
    <div className="p-4 space-y-4 bg-card rounded-lg border">
      {/* Header with Source */}
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", channelColor)}>
          <ChannelIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{task.customer_name}</span>
            {task.channel === 'email' && task.recipient_inbox && (
              <Badge className={cn("text-xs", INBOX_COLORS[task.recipient_inbox] || 'bg-muted')}>
                via {task.recipient_inbox}@
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {task.customer_handle}
          </div>
        </div>
        <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
          {task.priority || 'normal'}
        </Badge>
      </div>

      {/* Task Type */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs uppercase tracking-wider">
          {task.action_type.replace(/_/g, ' ')}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatTimeAZ(task.created_at)}
        </span>
      </div>

      {/* Original Message */}
      {task.original_message && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-1 text-muted-foreground">Original Message:</p>
          <p className="text-sm whitespace-pre-wrap">{task.original_message}</p>
        </div>
      )}

      {/* File Previews */}
      {task.file_urls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Attachments ({task.file_urls.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {task.file_urls.slice(0, 4).map((url, index) => (
              <a 
                key={index} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative group"
              >
                <img 
                  src={url} 
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              </a>
            ))}
          </div>
          {task.file_urls.length > 4 && (
            <p className="text-xs text-muted-foreground text-center">
              +{task.file_urls.length - 4} more files
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={onApprove}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReroute}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Re-route
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}
