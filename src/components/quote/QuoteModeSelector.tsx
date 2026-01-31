import { Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuoteMode = "quick" | "full";

interface QuoteModeSelectorProps {
  mode: QuoteMode;
  onModeChange: (mode: QuoteMode) => void;
}

export function QuoteModeSelector({ mode, onModeChange }: QuoteModeSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
      <button
        type="button"
        onClick={() => onModeChange("quick")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all font-medium",
          mode === "quick"
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
            : "hover:bg-muted text-muted-foreground"
        )}
      >
        <Zap className="h-4 w-4" />
        Quick Price
      </button>
      <button
        type="button"
        onClick={() => onModeChange("full")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all font-medium",
          mode === "full"
            ? "bg-primary text-primary-foreground shadow-lg"
            : "hover:bg-muted text-muted-foreground"
        )}
      >
        <FileText className="h-4 w-4" />
        Full Quote
      </button>
    </div>
  );
}
