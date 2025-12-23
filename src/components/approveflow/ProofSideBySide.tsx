import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ZoomIn, Image as ImageIcon, Box } from "lucide-react";

interface ProofSideBySideProps {
  designProofUrl: string;
  renderUrls?: Record<string, string>;
}

const ANGLE_LABELS: Record<string, string> = {
  hero: "Hero View",
  front_34: "Front 3/4",
  rear_34: "Rear 3/4",
  driver_side: "Driver Side",
  passenger_side: "Passenger Side",
  front: "Front",
  rear: "Rear",
};

export function ProofSideBySide({ designProofUrl, renderUrls }: ProofSideBySideProps) {
  const angleKeys = renderUrls ? Object.keys(renderUrls) : [];
  const [selectedAngle, setSelectedAngle] = useState<string>(
    angleKeys.includes("front_34") ? "front_34" : angleKeys[0] || "hero"
  );

  const currentRenderUrl = renderUrls?.[selectedAngle];
  const has3DRenders = renderUrls && Object.keys(renderUrls).length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* 2D Design Proof - Left Panel */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span>2D Design Proof</span>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="group relative aspect-[4/3] bg-muted/50 rounded-xl overflow-hidden border border-border/50 cursor-zoom-in hover:border-primary/50 transition-colors">
              <img
                src={designProofUrl}
                alt="2D Design Proof"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-2 bg-black/95">
            <img
              src={designProofUrl}
              alt="2D Design Proof - Full Size"
              className="w-full h-auto rounded-lg"
            />
          </DialogContent>
        </Dialog>
        
        <p className="text-xs text-muted-foreground text-center">
          Click to zoom
        </p>
      </div>

      {/* 3D Vehicle Preview - Right Panel */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Box className="w-4 h-4" />
          <span>3D Vehicle Preview</span>
        </div>

        {has3DRenders && currentRenderUrl ? (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <div className="group relative aspect-[4/3] bg-muted/50 rounded-xl overflow-hidden border border-border/50 cursor-zoom-in hover:border-primary/50 transition-colors">
                  <img
                    src={currentRenderUrl}
                    alt={`3D Render - ${ANGLE_LABELS[selectedAngle] || selectedAngle}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs text-white font-medium">
                    {ANGLE_LABELS[selectedAngle] || selectedAngle}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-2 bg-black/95">
                <img
                  src={currentRenderUrl}
                  alt={`3D Render - ${ANGLE_LABELS[selectedAngle] || selectedAngle} - Full Size`}
                  className="w-full h-auto rounded-lg"
                />
              </DialogContent>
            </Dialog>

            {/* Angle Thumbnails */}
            {angleKeys.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {angleKeys.map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setSelectedAngle(angle)}
                    className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedAngle === angle
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={renderUrls[angle]}
                      alt={ANGLE_LABELS[angle] || angle}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              {angleKeys.length > 1 ? "Select angle • Click to zoom" : "Click to zoom"}
            </p>
          </>
        ) : (
          <div className="aspect-[4/3] bg-muted/30 rounded-xl border border-dashed border-border/50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Box className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">3D preview not yet available</p>
              <p className="text-xs text-muted-foreground/70">Our team is preparing your visualization</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
