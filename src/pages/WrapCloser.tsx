import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function WrapCloser() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          WrapCloser (DesignProAI)
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered design generation and wrap visualization
        </p>
      </div>

      <Card className="p-12 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-purple rounded-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Module Coming Soon</h2>
          <p className="text-muted-foreground">
            WrapCloser will revolutionize your wrap design process with
            AI-powered generation, intelligent templates, and real-time
            visualization tools.
          </p>
        </div>
      </Card>
    </div>
  );
}
