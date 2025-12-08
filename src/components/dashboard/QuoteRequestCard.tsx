import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquareQuote, Car } from "lucide-react";

interface QuoteRequest {
  id: string;
  action_payload: {
    source?: string;
    vehicle?: {
      year?: string;
      make?: string;
      model?: string;
    };
    message?: string;
    sender_id?: string;
  };
  created_at: string;
  priority?: string;
}

export function QuoteRequestCard() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("quote-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_actions" },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadRequests() {
    const { data, error } = await supabase
      .from("ai_actions")
      .select("*")
      .eq("action_type", "create_quote")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error loading quote requests:", error);
      return;
    }

    setRequests((data as QuoteRequest[]) || []);
  }

  function openQuoteBuilder(req: QuoteRequest) {
    const prefillData = {
      customerName: req.action_payload?.sender_id || "",
      vehicleYear: req.action_payload?.vehicle?.year || "",
      vehicleMake: req.action_payload?.vehicle?.make || "",
      vehicleModel: req.action_payload?.vehicle?.model || "",
      source: req.action_payload?.source || "",
    };
    const payload = encodeURIComponent(JSON.stringify(prefillData));
    navigate(`/mighty-customer?prefill=${payload}`);
  }

  const getSourceColor = (source?: string) => {
    switch (source) {
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "email":
        return "bg-blue-500";
      case "website":
        return "bg-green-500";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageSquareQuote className="h-5 w-5 text-primary" />
          Quote Requests
          {requests.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {requests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending quote requests
          </p>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {req.action_payload?.vehicle?.year || ""}{" "}
                    {req.action_payload?.vehicle?.make || ""}{" "}
                    {req.action_payload?.vehicle?.model || "Vehicle TBD"}
                  </span>
                </div>
                <Badge className={`${getSourceColor(req.action_payload?.source)} text-white text-xs`}>
                  {req.action_payload?.source || "unknown"}
                </Badge>
              </div>

              {req.action_payload?.message && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  "{req.action_payload.message}"
                </p>
              )}

              <Button
                size="sm"
                className="w-full"
                onClick={() => openQuoteBuilder(req)}
              >
                Build Quote
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
