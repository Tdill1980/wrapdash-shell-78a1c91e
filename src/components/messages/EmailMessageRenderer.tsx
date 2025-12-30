import { useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Mail, Paperclip, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAZ } from "@/lib/timezone";

interface EmailMessageRendererProps {
  message: {
    id: string;
    content: string;
    direction: string;
    channel: string;
    created_at: string | null;
    sender_name: string | null;
    sender_email?: string | null;
    metadata?: {
      subject?: string;
      from?: string;
      to?: string;
      cc?: string;
      from_email?: string;
      to_email?: string;
      attachments?: Array<{ name?: string; url: string; type?: string }>;
      [key: string]: unknown;
    } | null;
  };
}

export function EmailMessageRenderer({ message }: EmailMessageRendererProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRawHtml, setShowRawHtml] = useState(false);

  const metadata = message.metadata || {};
  const subject = metadata.subject || "(no subject)";
  const from = metadata.from || metadata.from_email || message.sender_name || message.sender_email || "Unknown";
  const to = metadata.to || metadata.to_email || "";
  const cc = metadata.cc || "";
  const attachments = metadata.attachments || [];

  // The raw HTML content
  const rawHtml = message.content || "";

  // Check if content looks like HTML
  const isHtmlContent = rawHtml.includes("<") && rawHtml.includes(">");

  // Sanitize HTML but preserve structure for email rendering
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "form", "input", "button"],
    FORBID_ATTR: ["onclick", "onload", "onerror"],
  });

  // Extract plain text for collapsed preview
  const getPlainTextPreview = (html: string): string => {
    if (!isHtmlContent) return html.slice(0, 200);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body?.textContent || html;
    return text.replace(/\s+/g, " ").trim().slice(0, 200);
  };

  const plainTextPreview = getPlainTextPreview(rawHtml);

  return (
    <div className={cn(
      "rounded-lg border bg-card overflow-hidden",
      message.direction === "outbound" 
        ? "border-primary/30 bg-primary/5" 
        : "border-border"
    )}>
      {/* Email Header */}
      <div 
        className="p-3 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{from}</span>
                {message.direction === "outbound" && (
                  <Badge variant="outline" className="text-[10px]">Sent</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                <strong>Subject:</strong> {subject}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {message.created_at ? formatTimeAZ(message.created_at) : ""}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Collapsed preview */}
        {!isExpanded && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {plainTextPreview}...
          </p>
        )}
      </div>

      {/* Expanded Email Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Full headers */}
          <div className="text-xs space-y-1 pb-2 border-b border-border/50">
            <div><strong className="text-muted-foreground">From:</strong> {from}</div>
            {to && <div><strong className="text-muted-foreground">To:</strong> {to}</div>}
            {cc && <div><strong className="text-muted-foreground">CC:</strong> {cc}</div>}
            <div><strong className="text-muted-foreground">Subject:</strong> {subject}</div>
          </div>

          {/* Toggle for raw HTML view */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowRawHtml(!showRawHtml);
              }}
            >
              {showRawHtml ? "Formatted View" : "View Source"}
            </Button>
          </div>

          {/* Email Body */}
          <div className="email-body">
            {showRawHtml ? (
              <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto max-h-[400px] whitespace-pre-wrap break-all">
                {rawHtml}
              </pre>
            ) : isHtmlContent ? (
              <iframe
                sandbox="allow-same-origin"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { 
                          font-family: system-ui, -apple-system, sans-serif; 
                          font-size: 14px; 
                          line-height: 1.5;
                          color: #374151;
                          padding: 8px;
                          margin: 0;
                        }
                        img { max-width: 100%; height: auto; }
                        a { color: #2563eb; }
                        blockquote { 
                          border-left: 3px solid #d1d5db; 
                          margin: 8px 0; 
                          padding-left: 12px; 
                          color: #6b7280;
                        }
                        table { border-collapse: collapse; }
                        td, th { padding: 4px 8px; }
                      </style>
                    </head>
                    <body>${sanitizedHtml}</body>
                  </html>
                `}
                className="w-full min-h-[200px] max-h-[500px] border-0 rounded bg-white"
                title="Email content"
                onLoad={(e) => {
                  // Auto-resize iframe to content
                  const iframe = e.target as HTMLIFrameElement;
                  try {
                    const height = iframe.contentDocument?.body?.scrollHeight || 200;
                    iframe.style.height = `${Math.min(height + 20, 500)}px`;
                  } catch {
                    // Cross-origin restrictions may prevent access
                  }
                }}
              />
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-words p-3 bg-muted/30 rounded">
                {rawHtml}
              </pre>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                <Paperclip className="w-3 h-3" />
                Attachments ({attachments.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {att.name || `Attachment ${idx + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
