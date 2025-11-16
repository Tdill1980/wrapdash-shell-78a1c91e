import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ApproveFlow() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-5xl font-display text-gradient-purple">
          ApproveFlow
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Customer approval and feedback workflow
        </p>
      </div>

      <Card className="p-16 bg-card border-border rounded-2xl text-center shadow-card">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-gradient-purple rounded-2xl shadow-glow-sm">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-display">Module Coming Soon</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Streamline design approvals with customer portals, feedback
            collection, version comparison, and approval tracking.
          </p>
        </div>
      </Card>
    </div>
  );
}
