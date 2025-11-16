import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function ShopFlow() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          ShopFlow
        </h1>
        <p className="text-muted-foreground mt-2">
          E-commerce and order management platform
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-teal rounded-2xl">
              <ShoppingCart className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            Manage your wrap shop's e-commerce operations with integrated order
            processing, payment handling, and fulfillment tracking.
          </p>
        </div>
      </Card>
    </div>
  );
}
