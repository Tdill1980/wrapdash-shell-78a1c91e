import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/layouts/MainLayout";
import { usePortfolioJobs, usePortfolioMedia } from "@/hooks/usePortfolioJobs";
import { PortfolioJobCard } from "@/components/portfolio/PortfolioJobCard";
import { PortfolioJobDialog } from "@/components/portfolio/PortfolioJobDialog";
import { PortfolioMediaUploadDialog } from "@/components/portfolio/PortfolioMediaUploadDialog";
import { PortfolioAnalytics } from "@/components/portfolio/PortfolioAnalytics";
import { PortfolioShareDialog } from "@/components/portfolio/PortfolioShareDialog";
import {
  Briefcase,
  Plus,
  Search,
  Image,
  CheckCircle,
  Clock,
  Star,
  Loader2,
  Share2,
  QrCode,
} from "lucide-react";

export default function Portfolio() {
  const { jobs, loading, createJob, deleteJob, fetchJobs } = usePortfolioJobs();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Filter jobs based on tab and search
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Filter by tab
    if (activeTab === "completed") {
      result = result.filter((j) => j.status === "published");
    } else if (activeTab === "pending") {
      result = result.filter((j) => j.status === "pending" || j.status === "draft");
    } else if (activeTab === "favorites") {
      result = result.filter((j) => (j as any).is_featured);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title?.toLowerCase().includes(query) ||
          j.customer_name?.toLowerCase().includes(query) ||
          j.order_number?.toLowerCase().includes(query) ||
          j.vehicle_make?.toLowerCase().includes(query) ||
          j.vehicle_model?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [jobs, activeTab, searchQuery]);

  // Calculate stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "published").length;
  const pendingJobs = jobs.filter((j) => j.status === "pending" || j.status === "draft").length;

  const handleCreateJob = async (jobData: any) => {
    const newJob = await createJob(jobData);
    setIsCreateDialogOpen(false);
    fetchJobs();
    // Auto-open upload dialog for newly created legacy job
    if (newJob?.id) {
      setSelectedJobId(newJob.id);
      setIsUploadDialogOpen(true);
    }
    return newJob?.id || null;
  };

  const handleUploadMedia = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsUploadDialogOpen(true);
  };

  const handleEditJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsCreateDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-poppins">
              <span className="text-foreground">Mighty</span>
              <span className="text-gradient">Portfolio</span>
              <span className="text-muted-foreground text-sm align-super">™</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Showcase your best wrap projects with before/after galleries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Gallery
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          </div>
        </div>

        {/* Analytics Card */}
        <PortfolioAnalytics jobs={jobs} />

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="all" className="gap-2">
                <Briefcase className="w-4 h-4" />
                All ({totalJobs})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed ({completedJobs})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingJobs})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Star className="w-4 h-4" />
                Favorites
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Job Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 bg-card border-border text-center">
            <div className="max-w-lg mx-auto space-y-5">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Image className="w-8 h-8 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-xl font-semibold">
                {searchQuery ? "No jobs found" : "Start Your Portfolio"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Add your first wrap job to start building your portfolio gallery. Jobs auto-create from ShopFlow when marked complete."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Job
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredJobs.map((job) => (
              <PortfolioJobCard
                key={job.id}
                job={job}
                onEdit={() => handleEditJob(job.id)}
                onDelete={() => deleteJob(job.id)}
                onUpload={() => handleUploadMedia(job.id)}
              />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <PortfolioJobDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateJob}
          jobId={selectedJobId}
        />

        <PortfolioMediaUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          jobId={selectedJobId}
          onSuccess={() => {
            setIsUploadDialogOpen(false);
            fetchJobs();
          }}
        />

        <PortfolioShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
        />
      </div>
    </MainLayout>
  );
}
