import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function WrapBox() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          WrapBox
        </h1>
        <p className="text-muted-foreground mt-2">
          Inventory and material management system
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-purple rounded-2xl">
              <Package className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            Track materials, manage inventory, and optimize your wrap supply
            chain with intelligent forecasting and automated reordering.
          </p>
        </div>
      </Card>
    </div>
  );
}
