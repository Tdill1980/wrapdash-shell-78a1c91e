import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function MightyCustomer() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-5xl font-display text-gradient-teal">
          MightyCustomer
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Customer relationship and quote management
        </p>
      </div>

      <Card className="p-16 bg-card border-border rounded-2xl text-center shadow-card">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-gradient-teal rounded-2xl shadow-glow-sm">
              <Users className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-display">Module Coming Soon</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Manage customer relationships, generate quotes, track
            opportunities, and close more wrap jobs with CRM tools.
          </p>
        </div>
      </Card>
    </div>
  );
}
