import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Calendar, Trash2, RefreshCw, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContentQueueItem {
  id: string;
  content_type: string | null;
  mode: string | null;
  title: string | null;
  caption: string | null;
  hashtags: string[] | null;
  cta_text: string | null;
  script: string | null;
  output_url: string | null;
  media_urls: string[] | null;
  scheduled_for: string | null;
  status: string | null;
}

interface ContentReviewModalProps {
  item: ContentQueueItem;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onSchedule: (id: string, scheduledFor: string) => void;
  onDelete: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

export function ContentReviewModal({
  item,
  isOpen,
  onClose,
  onApprove,
  onSchedule,
  onDelete,
  onRegenerate,
}: ContentReviewModalProps) {
  const [scheduledFor, setScheduledFor] = useState(
    item.scheduled_for ? item.scheduled_for.slice(0, 16) : ""
  );
  const [editedCaption, setEditedCaption] = useState(item.caption || "");

  const handleApprove = () => {
    onApprove(item.id);
    toast.success("Content approved!");
    onClose();
  };

  const handleSchedule = () => {
    if (!scheduledFor) {
      toast.error("Please select a date and time");
      return;
    }
    onSchedule(item.id, scheduledFor);
    toast.success("Content scheduled!");
    onClose();
  };

  const handleDelete = () => {
    onDelete(item.id);
    toast.success("Content deleted");
    onClose();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-blue-500";
      case "scheduled":
        return "bg-green-500";
      case "deployed":
        return "bg-purple-500";
      case "review":
        return "bg-amber-500";
      default:
        return "bg-muted";
    }
  };

  const previewUrl = item.output_url || (item.media_urls && item.media_urls[0]);
  const isVideo = previewUrl?.includes(".mp4") || previewUrl?.includes("video");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Content
            <Badge className={getStatusColor(item.status)}>
              {item.status || "draft"}
            </Badge>
            {item.mode && (
              <Badge variant="outline">{item.mode}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Preview */}
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border border-border bg-muted">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-[300px]"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Content preview"
                  className="w-full max-h-[300px] object-contain"
                />
              )}
            </div>
          )}

          {/* Content Type & Title */}
          <div className="flex gap-2">
            {item.content_type && (
              <Badge variant="secondary">{item.content_type}</Badge>
            )}
            {item.title && (
              <span className="text-sm font-medium">{item.title}</span>
            )}
          </div>

          {/* Editable Caption */}
          <div className="space-y-2">
            <Label>Caption</Label>
            <Textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows={4}
              className="bg-background"
            />
          </div>

          {/* Hashtags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="space-y-1">
              <Label>Hashtags</Label>
              <div className="flex flex-wrap gap-1">
                {item.hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {item.cta_text && (
            <div className="space-y-1">
              <Label>Call to Action</Label>
              <Badge className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                {item.cta_text}
              </Badge>
            </div>
          )}

          {/* Script (if video) */}
          {item.script && (
            <details className="space-y-1">
              <summary className="text-sm font-medium cursor-pointer">
                View Script
              </summary>
              <pre className="text-xs bg-muted/50 p-2 rounded mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                {item.script}
              </pre>
            </details>
          )}

          {/* Schedule Picker */}
          <div className="space-y-2">
            <Label>Schedule For</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            <Button onClick={handleApprove} className="bg-blue-500 hover:bg-blue-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button onClick={handleSchedule} variant="default">
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </Button>
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={() => {
                  onRegenerate(item.id);
                  toast.success("Regenerating variants...");
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            )}
            <Button variant="ghost" onClick={handleDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
