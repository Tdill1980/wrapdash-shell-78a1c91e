import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Flame, Clock, CheckCircle, ArrowLeft, MessageSquare, Bot, User } from "lucide-react";
import { format } from "date-fns";

interface PhoneCall {
  id: string;
  caller_phone: string;
  customer_name?: string | null;
  transcript?: string | null;
  ai_classification?: {
    intent?: string;
    vehicle_info?: {
      make?: string;
      model?: string;
      year?: string;
    };
    summary?: string;
    messages?: Array<{
      role: "ai" | "caller";
      content: string;
    }>;
  } | null;
  is_hot_lead?: boolean;
  sms_sent?: boolean;
  sms_sent_at?: string | null;
  call_duration_seconds?: number | null;
  status?: string;
  created_at: string;
}

interface PhoneTranscriptViewProps {
  call: PhoneCall;
  onBack?: () => void;
  onCallBack?: () => void;
}

export function PhoneTranscriptView({ call, onBack, onCallBack }: PhoneTranscriptViewProps) {
  const classification = call.ai_classification;
  const vehicleInfo = classification?.vehicle_info;
  const messages = classification?.messages || [];

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntentLabel = (intent?: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      quote_request: { label: "Quote Request", color: "bg-emerald-500 text-white" },
      upset_customer: { label: "Upset Customer", color: "bg-red-500 text-white" },
      order_status: { label: "Order Status", color: "bg-blue-500 text-white" },
      general_inquiry: { label: "General Inquiry", color: "bg-muted text-foreground" },
    };
    return labels[intent || "general_inquiry"] || labels.general_inquiry;
  };

  const intentInfo = getIntentLabel(classification?.intent);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {call.customer_name || "Unknown Caller"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatPhoneNumber(call.caller_phone)}
              </p>
            </div>
          </div>
          {onCallBack && (
            <Button onClick={onCallBack} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
              <Phone className="w-4 h-4" />
              Call Back
            </Button>
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <Badge className={intentInfo.color}>
            {intentInfo.label}
          </Badge>
          {call.is_hot_lead && (
            <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1">
              <Flame className="w-3 h-3" />
              HOT LEAD
            </Badge>
          )}
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(call.call_duration_seconds)}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {format(new Date(call.created_at), "MMM d, h:mm a")}
          </Badge>
        </div>
      </div>

      {/* Transcript Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* AI Summary Card */}
          {classification?.summary && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground">{classification.summary}</p>
                {vehicleInfo && (vehicleInfo.year || vehicleInfo.make || vehicleInfo.model) && (
                  <p className="text-sm text-amber-400 mt-2">
                    🚗 Vehicle: {[vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(" ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transcript Messages */}
          {messages.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Conversation Transcript
              </h3>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "ai" ? "" : "flex-row-reverse"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "ai" 
                      ? "bg-amber-500/20 text-amber-400" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "ai"
                      ? "bg-muted text-foreground"
                      : "bg-amber-500/20 text-foreground"
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : call.transcript ? (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Raw Transcript
              </h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{call.transcript}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No transcript available</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - SMS Alert Status */}
      {call.sms_sent && (
        <div className="p-4 border-t border-border bg-green-500/10">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            SMS alert sent
            {call.sms_sent_at && (
              <span className="text-muted-foreground">
                at {format(new Date(call.sms_sent_at), "h:mm a")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
