import { Card } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

export default function DesignVault() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          DesignVault
        </h1>
        <p className="text-muted-foreground mt-2">
          Centralized design asset management and organization
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-teal rounded-2xl">
              <FolderOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            Store, organize, and manage all your wrap designs in one secure,
            searchable vault with advanced tagging and version control.
          </p>
        </div>
      </Card>
    </div>
  );
}
