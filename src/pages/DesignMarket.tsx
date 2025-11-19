import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function DesignMarket() {
  return (
    <div className="w-full space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-poppins">
          <span className="text-foreground">Design</span>
          <span className="text-gradient">Market</span>
          <span className="text-muted-foreground text-sm align-super">™</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buy and sell premium wrap designs
        </p>
      </div>

      <Card className="p-12 bg-card border-border text-center">
        <div className="w-full space-y-5">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Module Coming Soon</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Discover and purchase exclusive wrap designs from top artists, or
            list your own creations in the marketplace.
          </p>
        </div>
      </Card>
    </div>
  );
}
