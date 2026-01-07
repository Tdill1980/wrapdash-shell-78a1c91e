import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ZoomIn } from "lucide-react";

interface ProofSixViewGridProps {
  renderUrls?: Record<string, string>;
  vehicleYear?: string | number;
  vehicleMake?: string;
  vehicleModel?: string;
}

// Standard 6-view layout matching StudioRenderOS output
const VIEW_ORDER = [
  { key: "driver_side", label: "Driver Side" },
  { key: "front", label: "Front" },
  { key: "rear", label: "Rear" },
  { key: "passenger_side", label: "Passenger Side" },
  { key: "top", label: "Top" },
  { key: "detail", label: "Detail" },
] as const;

// Fallback mappings for different key formats
const KEY_ALIASES: Record<string, string[]> = {
  driver_side: ["driver_side", "driver", "left", "side_left"],
  passenger_side: ["passenger_side", "passenger", "right", "side_right"],
  front: ["front", "front_34", "hero"],
  rear: ["rear", "rear_34", "back"],
  top: ["top", "overhead", "birds_eye"],
  detail: ["detail", "closeup", "logo"],
};

const isValidImageUrl = (value: string): boolean => {
  return value?.startsWith("https://") || value?.startsWith("http://") || value?.startsWith("data:image/");
};

const findImageForView = (viewKey: string, urls: Record<string, string>): string | null => {
  const aliases = KEY_ALIASES[viewKey] || [viewKey];
  for (const alias of aliases) {
    if (urls[alias] && isValidImageUrl(urls[alias])) {
      return urls[alias];
    }
  }
  return null;
};

export function ProofSixViewGrid({
  renderUrls,
  vehicleYear,
  vehicleMake,
  vehicleModel,
}: ProofSixViewGridProps) {
  const [selectedView, setSelectedView] = useState<string | null>(null);

  // Filter valid image URLs
  const validUrls = renderUrls
    ? Object.fromEntries(
        Object.entries(renderUrls).filter(([_, url]) => isValidImageUrl(url))
      )
    : {};

  const hasRenders = Object.keys(validUrls).length > 0;

  if (!hasRenders) {
    return (
      <div className="aspect-[16/9] bg-muted/30 rounded-xl border border-dashed border-border/50 flex items-center justify-center">
        <div className="text-center space-y-2 p-8">
          <p className="text-sm text-muted-foreground">3D renders not yet available</p>
          <p className="text-xs text-muted-foreground/70">
            Our team is preparing your vehicle visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 3x2 Grid - Matching RestylePro layout */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {VIEW_ORDER.map((view) => {
          const imageUrl = findImageForView(view.key, validUrls);
          
          return (
            <Dialog key={view.key}>
              <DialogTrigger asChild>
                <div 
                  className={`
                    group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer 
                    border border-border/50 bg-muted/30
                    hover:border-primary/50 transition-all
                    ${!imageUrl ? 'opacity-50' : ''}
                  `}
                >
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={view.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                  )}
                  
                  {/* View Label Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-2 px-3">
                    <span className="text-xs font-medium text-white">{view.label}</span>
                  </div>
                </div>
              </DialogTrigger>
              
              {imageUrl && (
                <DialogContent className="max-w-4xl p-2 bg-black/95">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={`${view.label} - Full Size`}
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-md">
                      <span className="text-sm font-medium text-white">{view.label}</span>
                    </div>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          );
        })}
      </div>

      {/* View count indicator */}
      <p className="text-xs text-muted-foreground text-center">
        {Object.keys(validUrls).length} of 6 views available • Click any view to enlarge
      </p>
    </div>
  );
}
