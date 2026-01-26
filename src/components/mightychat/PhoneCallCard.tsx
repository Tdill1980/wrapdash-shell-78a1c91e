import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Flame, Clock, MessageSquare, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface PhoneCallCardProps {
  call: {
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
    } | null;
    is_hot_lead?: boolean;
    sms_sent?: boolean;
    call_duration_seconds?: number | null;
    status?: string;
    created_at: string;
  };
  onClick?: () => void;
  onAction?: () => void;
}

export function PhoneCallCard({ call, onClick, onAction }: PhoneCallCardProps) {
  const classification = call.ai_classification;
  const vehicleInfo = classification?.vehicle_info;
  
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
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntentBadge = (intent?: string) => {
    if (!intent) return null;
    const intentColors: Record<string, string> = {
      quote_request: "bg-emerald-500/20 text-emerald-400",
      upset_customer: "bg-red-500/20 text-red-400",
      order_status: "bg-blue-500/20 text-blue-400",
      general_inquiry: "bg-muted text-muted-foreground",
    };
    return (
      <Badge className={`text-[10px] uppercase ${intentColors[intent] || intentColors.general_inquiry}`}>
        {intent.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <Card 
      className="hover:bg-accent/50 transition-colors cursor-pointer border-amber-500/20" 
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Row 1: Phone icon + Intent badge + Hot lead */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400">
              <Phone className="w-4 h-4" />
            </div>
            {getIntentBadge(classification?.intent)}
            {call.is_hot_lead && (
              <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1 text-[10px]">
                <Flame className="w-3 h-3" />
                HOT LEAD
              </Badge>
            )}
          </div>
          {onAction && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 rounded-full"
              onClick={(e) => { e.stopPropagation(); onAction(); }}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Row 2: Caller name and phone */}
        <p className="text-sm font-medium text-foreground mb-0.5">
          {call.customer_name || "Unknown Caller"}
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {formatPhoneNumber(call.caller_phone)}
        </p>

        {/* Row 3: AI summary or transcript preview */}
        {classification?.summary ? (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            "{classification.summary}"
          </p>
        ) : call.transcript ? (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            "{call.transcript.substring(0, 100)}..."
          </p>
        ) : null}

        {/* Row 4: Vehicle info if available */}
        {vehicleInfo && (vehicleInfo.year || vehicleInfo.make || vehicleInfo.model) && (
          <p className="text-xs text-amber-400 mb-2">
            🚗 {[vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(" ")}
          </p>
        )}

        {/* Row 5: Metadata */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(call.created_at), "h:mm a")}
            </span>
            {formatDuration(call.call_duration_seconds) && (
              <span>• {formatDuration(call.call_duration_seconds)}</span>
            )}
          </div>
          {call.sms_sent && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-3 h-3" />
              SMS sent
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
