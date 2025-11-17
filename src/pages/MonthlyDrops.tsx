import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function MonthlyDrops() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-foreground">Monthly</span>
          <span className="text-primary">Drops</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curated wrap design collections released monthly
        </p>
      </div>

      <Card className="p-12 bg-card border-border text-center">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Module Coming Soon</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Get exclusive access to professionally curated wrap designs
            released monthly, featuring trending styles and premium templates.
          </p>
        </div>
      </Card>
    </div>
  );
}
