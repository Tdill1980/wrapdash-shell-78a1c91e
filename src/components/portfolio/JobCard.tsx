import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Share2 } from "lucide-react";
import { PortfolioJob } from "@/hooks/usePortfolioJobs";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface JobCardProps {
  job: PortfolioJob;
  onClick: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const beforeMedia = job.portfolio_media?.find(m => m.media_type === 'before');
  const afterMedia = job.portfolio_media?.find(m => m.media_type === 'after');
  const primaryMedia = afterMedia || beforeMedia || job.portfolio_media?.[0];
  
  const hasBeforeAndAfter = beforeMedia && afterMedia;
  const primaryTag = job.tags?.[0];
  const otherTags = job.tags?.slice(1, 4) || [];

  const vehicleInfo = [job.vehicle_year, job.vehicle_make, job.vehicle_model]
    .filter(Boolean)
    .join(' ');

  return (
    <Card 
      className="group relative overflow-hidden rounded-xl bg-card border-border cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={onClick}
    >
      {/* Image Area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {hasBeforeAndAfter ? (
          <BeforeAfterSlider
            beforeUrl={beforeMedia.storage_path}
            afterUrl={afterMedia.storage_path}
          />
        ) : primaryMedia ? (
          <img 
            src={primaryMedia.storage_path} 
            alt={job.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No photos yet
          </div>
        )}

        {/* Top badges */}
        {primaryTag && (
          <Badge className="absolute top-3 left-3 bg-pink-500 hover:bg-pink-600 text-white">
            {primaryTag}
          </Badge>
        )}
        
        {job.job_price > 0 && (
          <Badge 
            variant="outline" 
            className="absolute top-3 right-3 border-pink-500 text-pink-500 bg-background/80 backdrop-blur-sm"
          >
            ${job.job_price.toLocaleString()}
          </Badge>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" className="gap-1">
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button size="sm" variant="secondary" className="gap-1" onClick={(e) => e.stopPropagation()}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm" variant="secondary" className="gap-1" onClick={(e) => e.stopPropagation()}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
        
        <p className="text-sm text-muted-foreground truncate">
          {vehicleInfo && `${vehicleInfo} • `}
          {job.finish || 'No finish specified'}
        </p>

        {job.order_number && (
          <p className="text-xs text-muted-foreground">
            Order #{job.order_number}
          </p>
        )}

        {otherTags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {otherTags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
