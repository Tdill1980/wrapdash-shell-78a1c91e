import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, FileText, Image, Trash2, ExternalLink, Loader2 } from "lucide-react";
import type { ChatConversation } from "@/hooks/useWebsiteChats";
import { format } from "date-fns";

interface ConversationEvent {
  id: string;
  event_type: string;
  payload: {
    file_url?: string;
    filename?: string;
    file_type?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

interface ChatFileManagerProps {
  conversation: ChatConversation;
  assetEvents: ConversationEvent[];
  onFileUploaded?: () => void;
}

export function ChatFileManager({ conversation, assetEvents, onFileUploaded }: ChatFileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        // Upload to storage
        const filePath = `chat-attachments/${conversation.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath);

        // Log as conversation event
        await supabase.from('conversation_events').insert({
          conversation_id: conversation.id,
          event_type: 'asset_uploaded',
          actor: 'admin',
          payload: {
            filename: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            uploaded_by: 'internal_team'
          }
        });

        toast.success(`Uploaded ${file.name}`);
      }

      onFileUploaded?.();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType?.startsWith('image/')) return <Image className="h-4 w-4 text-purple-400" />;
    return <FileText className="h-4 w-4 text-blue-400" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="bg-[#1a1a2e] border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <FileText className="h-4 w-4 text-purple-400" />
          File Manager
          {assetEvents.length > 0 && (
            <Badge variant="outline" className="ml-auto bg-purple-500/10 text-purple-400 border-purple-500/30">
              {assetEvents.length} file{assetEvents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-4 text-center transition-all
            ${dragActive 
              ? 'border-fuchsia-500 bg-fuchsia-500/10' 
              : 'border-purple-500/30 hover:border-purple-500/50 bg-[#2a2a4a]'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*,.pdf,.doc,.docx,.ai,.psd,.eps"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-fuchsia-400 animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-purple-400" />
            )}
            <div className="text-xs text-gray-400">
              {isUploading 
                ? 'Uploading...' 
                : 'Drop files here or click to upload'
              }
            </div>
          </div>
        </div>

        {/* Files List */}
        {assetEvents.length > 0 && (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {assetEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[#2a2a4a] border border-white/10"
                >
                  {getFileIcon(event.payload?.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {event.payload?.filename || 'Unnamed file'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{format(new Date(event.created_at), 'MMM d, h:mm a')}</span>
                      {event.payload?.file_size && (
                        <span>• {formatFileSize(event.payload.file_size as number)}</span>
                      )}
                      {event.payload?.uploaded_by === 'internal_team' && (
                        <Badge variant="outline" className="text-[10px] py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">
                          Internal
                        </Badge>
                      )}
                    </div>
                  </div>
                  {event.payload?.file_url && (
                    <div className="flex items-center gap-1">
                      <a
                        href={event.payload.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
                      </a>
                      <a
                        href={event.payload.file_url}
                        download={event.payload.filename}
                        className="p-1.5 rounded bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-fuchsia-400" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty state */}
        {assetEvents.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-xs">
            No files uploaded yet. Customer uploads from "Check My File" will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
