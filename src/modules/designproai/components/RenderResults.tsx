import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RenderJob {
  angle: string;
  status: "pending" | "generating" | "complete" | "error";
  imageUrl?: string;
  error?: string;
}

interface RenderResultsProps {
  heroImageUrl?: string;
  backgroundJobs: RenderJob[];
}

const ANGLE_LABELS: Record<string, string> = {
  hero: "Hero Shot",
  side: "Side View",
  rear: "Rear View",
  detail: "Detail Shot",
};

export const RenderResults = ({ heroImageUrl, backgroundJobs }: RenderResultsProps) => {
  if (!heroImageUrl && backgroundJobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {heroImageUrl && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-purple bg-clip-text text-transparent">
            Your 3D Wrap Visualization
          </h3>
          <img
            src={heroImageUrl}
            alt="Hero render"
            className="w-full rounded-xl"
          />
        </Card>
      )}

      {backgroundJobs.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4">Additional Angles</h3>
          <div className="grid grid-cols-2 gap-4">
            {backgroundJobs.map((job) => (
              <div
                key={job.angle}
                className="relative aspect-video bg-surface rounded-lg overflow-hidden border border-border"
              >
                {job.status === "complete" && job.imageUrl ? (
                  <>
                    <img
                      src={job.imageUrl}
                      alt={ANGLE_LABELS[job.angle]}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {ANGLE_LABELS[job.angle]}
                    </div>
                  </>
                ) : job.status === "error" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-destructive text-center px-4">
                      {job.error || "Failed to generate"}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      {job.status === "pending" ? "Queued" : "Generating"}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ANGLE_LABELS[job.angle]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
