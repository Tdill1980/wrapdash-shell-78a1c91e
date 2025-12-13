import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioJob, PortfolioMedia, usePortfolioMedia } from "@/hooks/usePortfolioJobs";
import { supabase } from "@/integrations/supabase/client";
import {
  Car,
  Calendar,
  MoreVertical,
  Upload,
  Trash,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PortfolioJobCardProps {
  job: PortfolioJob;
  onEdit: (job: PortfolioJob) => void;
  onDelete: (id: string) => void;
  onUpload: (job: PortfolioJob) => void;
}

export function PortfolioJobCard({
  job,
  onEdit,
  onDelete,
  onUpload,
}: PortfolioJobCardProps) {
  const { media, getPublicUrl } = usePortfolioMedia(job.id);

  const beforeImages = media.filter((m) => m.media_type === "before");
  const afterImages = media.filter((m) => m.media_type === "after");

  const primaryAfter = afterImages[0];
  const primaryBefore = beforeImages[0];

  return (
    <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all">
      {/* Image Section */}
      <div className="relative aspect-video bg-muted">
        {primaryAfter ? (
          <img
            src={getPublicUrl(primaryAfter.storage_path)}
            alt={job.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Upload className="w-8 h-8" />
          </div>
        )}

        {/* Before/After indicator */}
        {primaryBefore && primaryAfter && (
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur">
            Before/After
          </Badge>
        )}

        {/* Status badge */}
        <Badge
          variant={job.status === "published" ? "default" : "secondary"}
          className="absolute bottom-2 left-2"
        >
          {job.status}
        </Badge>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onUpload(job)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{job.title}</h3>
            {job.customer_name && (
              <p className="text-sm text-muted-foreground truncate">
                {job.customer_name}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(job)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpload(job)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
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

        {/* Vehicle info */}
        {(job.vehicle_year || job.vehicle_make || job.vehicle_model) && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Car className="w-4 h-4" />
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
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
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

        {/* Media count */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <span>{beforeImages.length} before</span>
          <span>{afterImages.length} after</span>
          <span>{media.filter((m) => m.media_type === "process").length} process</span>
        </div>
      </CardContent>
    </Card>
  );
}
