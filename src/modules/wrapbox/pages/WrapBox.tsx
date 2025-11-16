import { useWrapBoxKits } from "../hooks/useWrapBoxKits";
import { KitCard } from "../components/KitCard";
import { Card } from "@/components/ui/card";
import { Package, Loader2 } from "lucide-react";

export default function WrapBox() {
  const { data: kits, isLoading } = useWrapBoxKits();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          WrapBox
        </h1>
        <p className="text-muted-foreground mt-2">
          Print pack manager for production-ready wrap files
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : kits && kits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              onClick={() => console.log("Kit clicked:", kit.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 bg-card border-border rounded-2xl text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-purple rounded-2xl">
                <Package className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">No Print Kits Yet</h2>
            <p className="text-muted-foreground">
              Create print kits from your designs in DesignVault to manage
              production files, panels, and export-ready packages.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
