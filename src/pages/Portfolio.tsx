import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function Portfolio() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-poppins">
          <span className="text-foreground">Port</span>
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">folio</span>
          <span className="text-muted-foreground text-sm align-super">™</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showcase your best wrap projects
        </p>
      </div>

      <Card className="p-12 bg-card border-border text-center">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Briefcase className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Module Coming Soon</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create stunning portfolio galleries to showcase your wrap projects
            with before/after views and project details.
          </p>
        </div>
      </Card>
    </div>
  );
}
