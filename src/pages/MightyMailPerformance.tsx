import { ToneDesignPerformance } from "@/components/ToneDesignPerformance";
import { UTIMAnalyticsDashboard } from "@/components/UTIMAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MightyMailPerformance() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/mightymail")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            <span className="text-white">Mighty</span>
            <span className="bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">Mail™</span>
            <span className="text-white"> Performance</span>
          </h2>
          <p className="text-muted-foreground">
            Revenue attribution and campaign optimization insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UTIMAnalyticsDashboard />
        <ToneDesignPerformance />
      </div>
    </div>
  );
}
