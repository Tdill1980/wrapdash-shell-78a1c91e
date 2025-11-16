import { Card } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function DesignMarket() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          Design Market
        </h1>
        <p className="text-muted-foreground mt-2">
          Marketplace for wrap designs and templates
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-purple rounded-2xl">
              <Store className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            Buy, sell, and trade wrap designs in our secure marketplace.
            Discover unique templates and monetize your creative work.
          </p>
        </div>
      </Card>
    </div>
  );
}
