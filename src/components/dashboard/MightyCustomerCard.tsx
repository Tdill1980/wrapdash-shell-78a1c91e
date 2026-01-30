import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ArrowRight, FileText, Calculator } from "lucide-react";

export function MightyCustomerCard() {
  const navigate = useNavigate();

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Mighty</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Customer</span>
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
        {/* Quick Action Banner */}
        <div 
          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 cursor-pointer hover:from-emerald-500/20 hover:to-teal-500/20 transition-colors"
          onClick={() => navigate("/mighty-customer")}
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 text-white flex items-center gap-1 px-2 py-1">
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
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">
              New Quote
            </span>
          </button>
          <button
            onClick={() => navigate("/quote-drafts")}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="p-1.5 rounded-md bg-teal-500/10">
              <FileText className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Quote Drafts
            </span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
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
