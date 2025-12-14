import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioJob, usePortfolioMedia, PortfolioMedia } from "@/hooks/usePortfolioJobs";
import {
  Car,
  Calendar,
  MoreVertical,
  Upload,
  Trash,
  Edit,
  Link,
  FileText,
  Play,
  ScanLine,
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

interface MediaThumbnailProps {
  item: PortfolioMedia;
  getPublicUrl: (path: string) => string;
  onClick: () => void;
}

function MediaThumbnail({ item, getPublicUrl, onClick }: MediaThumbnailProps) {
  const isVideo = item.file_type?.startsWith("video/");
  
  return (
    <div 
      className="relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={onClick}
    >
      <img
        src={getPublicUrl(item.storage_path)}
        alt=""
        className="w-full h-full object-cover"
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-3 h-3 text-black fill-black ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaRowProps {
  label: string;
  items: PortfolioMedia[];
  getPublicUrl: (path: string) => string;
  maxVisible?: number;
  onUpload: () => void;
}

function MediaRow({ label, items, getPublicUrl, maxVisible = 4, onUpload }: MediaRowProps) {
  const visibleItems = items.slice(0, maxVisible);
  const overflowCount = items.length - maxVisible;

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-14">{label}:</span>
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-md border border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={onUpload}
        >
          <Upload className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-14">{label}:</span>
      <div className="flex gap-1 flex-1">
        {visibleItems.map((item) => (
          <div key={item.id} className="w-8 h-8 flex-shrink-0">
            <MediaThumbnail 
              item={item} 
              getPublicUrl={getPublicUrl} 
              onClick={onUpload}
            />
          </div>
        ))}
        {overflowCount > 0 && (
          <div 
            className="w-8 h-8 rounded-md bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors flex-shrink-0"
            onClick={onUpload}
          >
            <span className="text-xs font-medium text-muted-foreground">+{overflowCount}</span>
          </div>
        )}
      </div>
    </div>
  );
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

  const beforeImages = media.filter((m) => m.media_type === "before");
  const afterImages = media.filter((m) => m.media_type === "after");
  const processImages = media.filter((m) => m.media_type === "process");

  const handleUpload = () => onUpload(job);
  
  const handleVinCaptured = () => {
    onJobUpdated?.();
  };

  return (
    <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all">
      {/* Header with badges */}
      <div className="p-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.order_number ? (
            <Badge className="bg-primary/90 backdrop-blur gap-1 text-xs">
              <Link className="w-3 h-3" />
              {job.order_number}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-background/80 backdrop-blur gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Legacy
            </Badge>
          )}
          <Badge
            variant={job.status === "published" ? "default" : "secondary"}
            className="text-xs"
          >
            {job.status}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
              className="text-destructive"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media Preview Grid */}
      <div className="px-3 py-2 space-y-2 border-y border-border bg-muted/30">
        <MediaRow 
          label="Before" 
          items={beforeImages} 
          getPublicUrl={getPublicUrl} 
          onUpload={handleUpload}
        />
        <MediaRow 
          label="After" 
          items={afterImages} 
          getPublicUrl={getPublicUrl} 
          onUpload={handleUpload}
        />
        {processImages.length > 0 && (
          <MediaRow 
            label="Process" 
            items={processImages} 
            getPublicUrl={getPublicUrl} 
            onUpload={handleUpload}
          />
        )}
      </div>

      {/* Content */}
      <CardContent className="p-3 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-sm">{job.title}</h3>
            {job.customer_name && (
              <p className="text-xs text-muted-foreground truncate">
                {job.customer_name}
              </p>
            )}
          </div>
        </div>

        {/* Vehicle info */}
        {(job.vehicle_year || job.vehicle_make || job.vehicle_model) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Car className="w-3 h-3" />
            <span>
              {[job.vehicle_year, job.vehicle_make, job.vehicle_model]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
        )}

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge variant="outline" className="text-xs py-0">
                +{job.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Date */}
        {job.created_at && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        )}
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