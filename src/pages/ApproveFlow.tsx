import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ApproveFlow() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          ApproveFlow
        </h1>
        <p className="text-muted-foreground mt-2">
          Design approval and review workflow system
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-teal rounded-2xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            Streamline design approvals with automated workflows, real-time
            feedback, version control, and client collaboration tools.
          </p>
        </div>
      </Card>
    </div>
  );
}
