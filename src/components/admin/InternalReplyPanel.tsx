import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, X, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ChatConversation } from "@/hooks/useWebsiteChats";

interface InternalReplyPanelProps {
  conversation: ChatConversation;
  customerEmail: string | null;
  customerName: string | null;
  onClose: () => void;
  onEmailSent: () => void;
}

export function InternalReplyPanel({
  conversation,
  customerEmail,
  customerName,
  onClose,
  onEmailSent,
}: InternalReplyPanelProps) {
  const [subject, setSubject] = useState(`Re: Your WePrintWraps Inquiry`);
  const [body, setBody] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const messages = conversation.messages || [];

  // Generate AI draft based on conversation context
  const handleAIDraft = async () => {
    setIsDrafting(true);
    try {
      // Build conversation summary for AI
      const conversationSummary = messages
        .slice(-10)
        .map((msg) => `${msg.direction === 'inbound' ? 'Customer' : 'Jordan'}: ${msg.content}`)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          agent: 'alex_morgan',
          prompt: `You are drafting a professional follow-up email to a customer. 

Customer Name: ${customerName || 'Valued Customer'}
Customer Email: ${customerEmail}

Recent conversation:
${conversationSummary}

Write a helpful, professional email response that:
1. Thanks them for their inquiry
2. Addresses their specific questions/needs based on the conversation
3. Provides clear next steps
4. Uses a warm, professional tone
5. Signs off as "The WePrintWraps Team"

Keep it concise (2-3 short paragraphs max). Do NOT include the subject line, just the body.`,
        },
      });

      if (error) throw error;

      if (data?.reply) {
        setBody(data.reply);
        toast.success('Draft generated!');
      }
    } catch (err) {
      console.error('Failed to generate draft:', err);
      toast.error('Failed to generate draft');
    } finally {
      setIsDrafting(false);
    }
  };

  // Send the email
  const handleSendEmail = async () => {
    if (!customerEmail || !body.trim()) {
      toast.error('Email address and message body are required');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-reply', {
        body: {
          conversation_id: conversation.id,
          to_email: customerEmail,
          to_name: customerName || undefined,
          subject: subject,
          body: body,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setEmailSent(true);
        toast.success('Email sent successfully!');
        onEmailSent();
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Failed to send email:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Email Sent!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your reply was sent to {customerEmail}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Reply to Customer
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {customerEmail && (
          <Badge variant="secondary" className="w-fit">
            To: {customerEmail}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Message</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIDraft}
              disabled={isDrafting}
              className="gap-2"
            >
              {isDrafting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              AI Draft
            </Button>
          </div>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message or click 'AI Draft' to generate one..."
            className="min-h-[200px] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending || !body.trim() || !customerEmail}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
