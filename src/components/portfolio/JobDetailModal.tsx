import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import { PortfolioJob } from "@/hooks/usePortfolioJobs";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { JobQRCodeGenerator } from "./JobQRCodeGenerator";
import { useState } from "react";

interface JobDetailModalProps {
  job: PortfolioJob | null;
  open: boolean;
  onClose: () => void;
  onDelete: (jobId: string) => void;
}

export function JobDetailModal({ job, open, onClose, onDelete }: JobDetailModalProps) {
  const [showQR, setShowQR] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  if (!job) return null;

  const beforeMedia = job.portfolio_media?.filter(m => m.media_type === 'before') || [];
  const afterMedia = job.portfolio_media?.filter(m => m.media_type === 'after') || [];
  const allMedia = job.portfolio_media || [];
  
  const hasBeforeAndAfter = beforeMedia.length > 0 && afterMedia.length > 0;

  const vehicleInfo = [job.vehicle_year, job.vehicle_make, job.vehicle_model]
    .filter(Boolean)
    .join(' ');

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this job?')) {
      onDelete(job.id);
      onClose();
    }
  };

  const nextMedia = () => {
    setCurrentMediaIndex(prev => (prev + 1) % allMedia.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
        </DialogHeader>

        {/* Media Display */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {showQR ? (
            <div className="p-8 flex items-center justify-center h-full">
              <JobQRCodeGenerator uploadToken={job.upload_token || ''} jobTitle={job.title} />
            </div>
          ) : hasBeforeAndAfter ? (
            <BeforeAfterSlider
              beforeUrl={beforeMedia[0].storage_path}
              afterUrl={afterMedia[0].storage_path}
            />
          ) : allMedia.length > 0 ? (
            <>
              <img 
                src={allMedia[currentMediaIndex]?.storage_path}
                alt={job.title}
                className="w-full h-full object-contain"
              />
              {allMedia.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                    onClick={prevMedia}
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                    onClick={nextMedia}
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {allMedia.map((_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${i === currentMediaIndex ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No photos uploaded yet. Scan QR code to add photos.
            </div>
          )}
        </div>

        {/* Toggle QR */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            {showQR ? 'Show Photos' : 'Show QR Code'}
          </Button>
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {vehicleInfo && (
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{vehicleInfo}</p>
              </div>
            )}
            {job.finish && (
              <div>
                <p className="text-sm text-muted-foreground">Finish</p>
                <p className="font-medium">{job.finish}</p>
              </div>
            )}
            {job.job_price > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">${job.job_price.toLocaleString()}</p>
              </div>
            )}
            {job.order_number && (
              <div>
                <p className="text-sm text-muted-foreground">Order #</p>
                <p className="font-medium">{job.order_number}</p>
              </div>
            )}
            {job.customer_name && (
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{job.customer_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                {job.status}
              </Badge>
            </div>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {job.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Media counts */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{beforeMedia.length} before photo(s)</span>
            <span>{afterMedia.length} after photo(s)</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
