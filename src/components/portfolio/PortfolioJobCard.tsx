import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PortfolioJob, usePortfolioMedia } from "@/hooks/usePortfolioJobs";
import {
  Car,
  Calendar,
  MoreVertical,
  Upload,
  Trash,
  Edit,
  Play,
  ScanLine,
  ImageIcon,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VinCaptureDialog } from "./VinCaptureDialog";

interface PortfolioJobCardProps {
  job: PortfolioJob;
  onEdit: (job: PortfolioJob) => void;
  onDelete: (id: string) => void;
  onUpload: (job: PortfolioJob) => void;
  onJobUpdated?: () => void;
}

export function PortfolioJobCard({
  job,
  onEdit,
  onDelete,
  onUpload,
  onJobUpdated,
}: PortfolioJobCardProps) {
  const { media, getPublicUrl } = usePortfolioMedia(job.id);
  const [vinDialogOpen, setVinDialogOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<"before" | "after">("after");

  const beforeImages = media.filter((m) => m.media_type === "before");
  const afterImages = media.filter((m) => m.media_type === "after");

  const handleUpload = () => onUpload(job);
  
  const handleVinCaptured = () => {
    onJobUpdated?.();
  };

  // Get preview image based on selected tab
  const currentImages = mediaTab === "before" ? beforeImages : afterImages;
  const previewImage = currentImages[0];
  const isVideo = previewImage?.file_type?.startsWith("video");

  return (
    <Card className="bg-card/60 backdrop-blur border-border/50 overflow-hidden group hover:border-primary/40 transition-all duration-300">
      {/* Preview Image with Tab Toggle */}
      <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden">
        {previewImage ? (
          <>
            <img
              src={getPublicUrl(previewImage.storage_path)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-black fill-black ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="w-10 h-10 opacity-30" />
            <span className="text-xs">No {mediaTab} photos</span>
            <Button variant="ghost" size="sm" onClick={handleUpload} className="text-xs">
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </Button>
          </div>
        )}

        {/* Before/After Tabs Overlay */}
        <div className="absolute bottom-2 left-2 right-2">
          <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "before" | "after")}>
            <TabsList className="w-full bg-black/60 backdrop-blur-sm border-0 h-8">
              <TabsTrigger 
                value="before" 
                className="flex-1 text-xs h-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
              >
                Before
                {beforeImages.length > 0 && (
                  <span className="ml-1 opacity-70">({beforeImages.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="after"
                className="flex-1 text-xs h-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--primary))] data-[state=active]:to-[hsl(var(--gradient-dark))] data-[state=active]:text-white"
              >
                After
                {afterImages.length > 0 && (
                  <span className="ml-1 opacity-70">({afterImages.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Badge */}
        <Badge
          className={`absolute top-2 left-2 text-xs ${
            job.status === "published" 
              ? "bg-green-500/90 text-white" 
              : "bg-amber-500/90 text-white"
          }`}
        >
          {job.status === "published" ? "Complete" : "Pending"}
        </Badge>

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/40 hover:bg-black/60 backdrop-blur-sm"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem onClick={() => onEdit(job)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVinDialogOpen(true)}>
              <ScanLine className="w-4 h-4 mr-2" />
              Capture VIN
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(job.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
          {job.customer_name && (
            <p className="text-xs text-muted-foreground truncate">
              {job.customer_name}
            </p>
          )}
        </div>

        {/* Vehicle info */}
        {(job.vehicle_year || job.vehicle_make || job.vehicle_model) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Car className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">
              {[job.vehicle_year, job.vehicle_make, job.vehicle_model]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
        )}

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/50">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 2 && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/50">
                +{job.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer with date and media count */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {job.created_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{beforeImages.length}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{afterImages.length}</span>
          </div>
        </div>
      </CardContent>

      {/* VIN Capture Dialog */}
      <VinCaptureDialog
        open={vinDialogOpen}
        onOpenChange={setVinDialogOpen}
        jobId={job.id}
        currentVin={job.vin_number}
        currentVinPhoto={job.vin_photo_path}
        onVinCaptured={handleVinCaptured}
      />
    </Card>
  );
}