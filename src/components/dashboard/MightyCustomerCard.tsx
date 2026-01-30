import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ArrowRight, FileText, Calculator, Mic, Sparkles } from "lucide-react";
import VoiceCommand from "@/components/VoiceCommand";

export function MightyCustomerCard() {
  const navigate = useNavigate();

  const handleVoiceTranscript = (transcript: string, parsedData: any) => {
    const params = new URLSearchParams();
    if (parsedData.customerName) params.set('customer', parsedData.customerName);
    if (parsedData.email) params.set('email', parsedData.email);
    if (parsedData.phone) params.set('phone', parsedData.phone);
    if (parsedData.vehicleYear) params.set('year', parsedData.vehicleYear);
    if (parsedData.vehicleMake) params.set('make', parsedData.vehicleMake);
    if (parsedData.vehicleModel) params.set('model', parsedData.vehicleModel);
    navigate(`/mighty-customer?${params.toString()}`);
  };

  return (
    <Card className="bg-card relative overflow-hidden">
      {/* VoiceCommand positioned in top-right */}
      <VoiceCommand onTranscript={handleVoiceTranscript} />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent font-semibold">
              MightyCustomer
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mighty-customer")}
            className="text-xs h-7 px-2"
          >
            Open Tool
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* VoiceCommand CTA Banner */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">VoiceCommand AI™</h3>
                <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">
                Click badge above → Hold & speak quote details
              </p>
            </div>
          </div>
          <div className="mt-3 bg-background/50 rounded-md p-2">
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              💡 "2024 Bronco full wrap customer John Smith phone 555-1234"
            </p>
          </div>
        </div>

        {/* Quick Action Banner */}
        <div 
          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 cursor-pointer hover:from-blue-500/20 hover:to-cyan-500/20 transition-colors"
          onClick={() => navigate("/mighty-customer")}
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center gap-1 px-2 py-1">
              <Calculator className="w-3 h-3" />
              Create Quote
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">Click to start</span>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/mighty-customer")}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="p-1.5 rounded-md bg-blue-500/10">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">
              New Quote
            </span>
          </button>
          <button
            onClick={() => navigate("/quote-drafts")}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="p-1.5 rounded-md bg-cyan-500/10">
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Quote Drafts
            </span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
          <span className="flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            Instant pricing tool
          </span>
          <span className="flex items-center gap-1">
            🚗 Vehicle wrap quotes
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
