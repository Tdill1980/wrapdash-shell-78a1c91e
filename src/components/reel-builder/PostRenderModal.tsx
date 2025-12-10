import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FolderOpen, 
  CalendarPlus, 
  Send,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

interface PostRenderModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  onDownload: () => void;
  onViewInLibrary: () => void;
  onSchedule: () => void;
  onSendToReview: () => void;
}

export function PostRenderModal({
  open,
  onClose,
  videoUrl,
  onDownload,
  onViewInLibrary,
  onSchedule,
  onSendToReview,
}: PostRenderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <DialogTitle>Reel Rendered Successfully!</DialogTitle>
          </div>
        </DialogHeader>

        {/* Preview */}
        <div className="aspect-[9/16] max-h-[200px] mx-auto bg-black rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted
            loop
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={onDownload}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Download</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={onViewInLibrary}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-xs">View in Library</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={onSendToReview}
          >
            <Send className="w-5 h-5" />
            <span className="text-xs">Send to Review</span>
          </Button>
          
          <Button 
            className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
            onClick={onSchedule}
          >
            <CalendarPlus className="w-5 h-5" />
            <span className="text-xs">Schedule Now</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Video saved to Media Library and Content Queue
        </p>
      </DialogContent>
    </Dialog>
  );
}
