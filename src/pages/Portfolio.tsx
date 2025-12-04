import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { usePortfolioJobs, PortfolioJob } from "@/hooks/usePortfolioJobs";
import { usePortfolioStats } from "@/hooks/usePortfolioStats";
import { GalleryGrid } from "@/components/portfolio/GalleryGrid";
import { AddJobForm, JobFormData } from "@/components/portfolio/AddJobForm";
import { JobDetailModal } from "@/components/portfolio/JobDetailModal";
import { PortfolioStatsCard } from "@/components/portfolio/PortfolioStatsCard";
import AITaggingSystem from "@/components/portfolio/AITaggingSystem";

export default function Portfolio() {
  const { jobs, loading, createJob, deleteJob } = usePortfolioJobs();
  const { stats } = usePortfolioStats(jobs);
  const [selectedJob, setSelectedJob] = useState<PortfolioJob | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery");

  const handleJobClick = (job: PortfolioJob) => {
    setSelectedJob(job);
    setDetailModalOpen(true);
  };

  const handleAddJob = async (formData: JobFormData) => {
    await createJob({
      title: formData.title,
      vehicle_year: formData.vehicle_year,
      vehicle_make: formData.vehicle_make,
      vehicle_model: formData.vehicle_model,
      finish: formData.finish,
      job_price: formData.job_price,
      tags: formData.tags
    });
    setActiveTab("gallery");
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-poppins">
            <span className="text-foreground">Mighty</span>
            <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Portfolio</span>
            <span className="text-muted-foreground text-sm align-super ml-1">AI™</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showcase your wrap projects with voice-powered entry & before/after photos
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="add">Add Job</TabsTrigger>
            <TabsTrigger value="tags">AI Tags</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-6">
            <GalleryGrid 
              jobs={jobs} 
              onJobClick={handleJobClick}
              onAddClick={() => setActiveTab("add")}
            />
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <AddJobForm onSubmit={handleAddJob} />
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <AITaggingSystem jobs={jobs} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <PortfolioStatsCard stats={stats} />
          </TabsContent>
        </Tabs>

        {/* Detail Modal */}
        <JobDetailModal 
          job={selectedJob}
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onDelete={deleteJob}
        />
      </div>
    </MainLayout>
  );
}
