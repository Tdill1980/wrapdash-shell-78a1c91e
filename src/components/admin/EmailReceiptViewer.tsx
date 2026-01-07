import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User, CheckCircle } from "lucide-react";
import type { ConversationEvent } from "@/hooks/useConversationEvents";

interface EmailReceiptViewerProps {
  emailEvents: ConversationEvent[];
}

export function EmailReceiptViewer({ emailEvents }: EmailReceiptViewerProps) {
  if (emailEvents.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No emails sent yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {emailEvents.map((event) => (
          <Card key={event.id} className="bg-card/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email Sent
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Delivered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Recipients */}
              {event.payload.email_sent_to && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">To: </span>
                    <span className="font-medium">{event.payload.email_sent_to.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Subject */}
              {event.payload.email_subject && (
                <div>
                  <span className="text-muted-foreground">Subject: </span>
                  <span className="font-medium">{event.payload.email_subject}</span>
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(event.created_at), 'PPpp')}
              </div>

              {/* Email Body */}
              {event.payload.email_body && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Email Content:</p>
                  <div 
                    className="p-3 bg-muted/30 rounded-lg text-xs max-h-32 overflow-auto prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: event.payload.email_body }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
