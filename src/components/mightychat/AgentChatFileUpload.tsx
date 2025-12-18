import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Image, Film, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Attachment {
  url: string;
  type?: string;
  name?: string;
}

interface AgentChatFileUploadProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

const MAX_FILES = 5;
const MAX_SIZE_MB = 50; // 50MB for videos

export function AgentChatFileUpload({
  attachments,
  onAttachmentsChange,
  disabled,
}: AgentChatFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_SIZE_MB}MB limit`);
          continue;
        }

        // Upload to media-library bucket
        const ext = file.name.split('.').pop();
        const fileName = `agent-chat/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

        const { data, error } = await supabase.storage
          .from("media-library")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from("media-library")
          .getPublicUrl(data.path);

        newAttachments.push({
          url: publicUrl.publicUrl,
          type: file.type,
          name: file.name,
        });
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const getFileIcon = (type?: string) => {
    if (type?.startsWith("image/")) return Image;
    if (type?.startsWith("video/")) return Film;
    return FileText;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, idx) => {
            const Icon = getFileIcon(att.type);
            const isImage = att.type?.startsWith("image/");

            return (
              <div
                key={idx}
                className="relative group rounded-lg border border-border/50 overflow-hidden bg-muted/50"
              >
                {isImage ? (
                  <img
                    src={att.url}
                    alt={att.name || "Attachment"}
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex flex-col items-center justify-center p-2">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-1">
                      {att.name?.slice(0, 10) || "File"}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || uploading || attachments.length >= MAX_FILES}
        onClick={() => fileInputRef.current?.click()}
        className={cn("h-9 w-9", attachments.length > 0 && "text-primary")}
        title="Attach files (images, videos, PDFs)"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
