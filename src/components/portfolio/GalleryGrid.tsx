import { useState, useMemo } from "react";
import { PortfolioJob } from "@/hooks/usePortfolioJobs";
import { JobCard } from "./JobCard";
import { TagFilterBar } from "./TagFilterBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Image } from "lucide-react";

interface GalleryGridProps {
  jobs: PortfolioJob[];
  onJobClick: (job: PortfolioJob) => void;
  onAddClick?: () => void;
}

export function GalleryGrid({ jobs, onJobClick, onAddClick }: GalleryGridProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags from jobs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    jobs.forEach(job => {
      (job.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [jobs]);

  // Filter jobs by selected tag
  const filteredJobs = useMemo(() => {
    if (!selectedTag) return jobs;
    return jobs.filter(job => 
      job.tags?.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
    );
  }, [jobs, selectedTag]);

  if (jobs.length === 0) {
    return (
      <Card className="p-12 bg-card border-border text-center">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Image className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-semibold">No Jobs Yet</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start building your portfolio by adding your first completed wrap job.
            Use voice input for quick entry!
          </p>
          {onAddClick && (
            <Button onClick={onAddClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Job
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <TagFilterBar 
        tags={allTags}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map(job => (
          <JobCard 
            key={job.id} 
            job={job} 
            onClick={() => onJobClick(job)}
          />
        ))}
      </div>

      {filteredJobs.length === 0 && selectedTag && (
        <div className="text-center py-12 text-muted-foreground">
          No jobs found with tag "{selectedTag}"
        </div>
      )}
    </div>
  );
}
