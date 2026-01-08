import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle,
  Send
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ChatConversation } from "@/hooks/useWebsiteChats";

interface QuoteUploadPanelProps {
  conversation: ChatConversation;
  customerEmail: string | null;
  customerName: string | null;
  onClose: () => void;
  onQuoteUploaded: () => void;
}

export function QuoteUploadPanel({
  conversation,
  customerEmail,
  customerName,
  onClose,
  onQuoteUploaded,
}: QuoteUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `quote-${conversation.id}-${Date.now()}.${fileExt}`;
      const filePath = `quotes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shopflow-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('shopflow-files')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Log quote_attached event
      const { error: eventError } = await supabase
        .from('conversation_events')
        .insert([{
          conversation_id: conversation.id,
          event_type: 'quote_attached',
          actor: 'admin',
          payload: {
            quote_number: quoteNumber || undefined,
            file_url: fileUrl,
            filename: file.name,
            notes: notes || undefined,
            customer_email: customerEmail,
            customer_name: customerName,
          },
        }]);

      if (eventError) throw eventError;

      // If send email is enabled, call edge function to email the quote
      if (sendEmail && customerEmail) {
        const { error: sendError } = await supabase.functions.invoke('send-admin-reply', {
          body: {
            conversationId: conversation.id,
            toEmail: customerEmail,
            toName: customerName,
            subject: quoteNumber 
              ? `Your WePrintWraps Quote #${quoteNumber}` 
              : 'Your WePrintWraps Quote',
            body: `Hi ${customerName || 'there'},\n\nThank you for your interest in WePrintWraps!\n\nPlease find your quote attached. If you have any questions or are ready to move forward, just reply to this email.\n\n${notes ? `Additional notes: ${notes}\n\n` : ''}Best regards,\nThe WePrintWraps Team`,
            attachmentUrl: fileUrl,
            attachmentName: file.name,
          },
        });

        if (sendError) {
          console.error('Email send error:', sendError);
          toast.warning("Quote uploaded but email failed to send");
        } else {
          toast.success("Quote uploaded and emailed to customer!");
        }
      } else {
        toast.success("Quote uploaded successfully!");
      }

      onQuoteUploaded();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload quote");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Quote
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="outline" className="text-xs">
                {(file.size / 1024).toFixed(1)} KB
              </Badge>
            </div>
          ) : isDragActive ? (
            <p className="text-sm text-primary">Drop the file here...</p>
          ) : (
            <div>
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a PDF or image, or click to select
              </p>
            </div>
          )}
        </div>

        {/* Quote Number */}
        <div className="space-y-1.5">
          <Label htmlFor="quoteNumber" className="text-xs">
            Quote Number (optional)
          </Label>
          <Input
            id="quoteNumber"
            placeholder="e.g., Q-2024-001"
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes to include..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm min-h-[60px]"
          />
        </div>

        {/* Send Email Toggle */}
        {customerEmail && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="sendEmail" className="text-xs cursor-pointer flex-1">
              Email quote to {customerEmail}
            </Label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : sendEmail && customerEmail ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Upload & Send
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Upload Quote
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
