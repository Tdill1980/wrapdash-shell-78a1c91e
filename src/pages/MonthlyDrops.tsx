import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function MonthlyDrops() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          Monthly Drops
        </h1>
        <p className="text-muted-foreground mt-2">
          Curated monthly design collections and releases
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-teal rounded-2xl">
              <Calendar className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            Access exclusive monthly design collections, trending patterns, and
            seasonal wrap designs delivered directly to your vault.
          </p>
        </div>
      </Card>
    </div>
  );
}
