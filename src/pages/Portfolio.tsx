import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/layouts/MainLayout";
import { usePortfolioJobs } from "@/hooks/usePortfolioJobs";
import { PortfolioJobCard } from "@/components/portfolio/PortfolioJobCard";
import { PortfolioJobDialog } from "@/components/portfolio/PortfolioJobDialog";
import { PortfolioMediaUploadDialog } from "@/components/portfolio/PortfolioMediaUploadDialog";
import { PortfolioAnalytics } from "@/components/portfolio/PortfolioAnalytics";
import { PortfolioShareDialog } from "@/components/portfolio/PortfolioShareDialog";
import {
  Plus,
  Search,
  Image,
  CheckCircle,
  Clock,
  Star,
  Loader2,
  Share2,
  Layers,
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
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--gradient-dark))]">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                MightyPortfolio
              </h1>
              <p className="text-sm text-muted-foreground">
                Showcase your best wrap projects
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--gradient-dark))]" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalJobs}</p>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedJobs}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingJobs}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/80 border border-border/50 p-1">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--primary))] data-[state=active]:to-[hsl(var(--gradient-dark))] data-[state=active]:text-white gap-1.5 px-4"
              >
                <Layers className="w-3.5 h-3.5" />
                All
                <Badge variant="secondary" className="ml-1 bg-background/20 text-xs px-1.5">{totalJobs}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white gap-1.5 px-4"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Completed
                <Badge variant="secondary" className="ml-1 bg-background/20 text-xs px-1.5">{completedJobs}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white gap-1.5 px-4"
              >
                <Clock className="w-3.5 h-3.5" />
                Pending
                <Badge variant="secondary" className="ml-1 bg-background/20 text-xs px-1.5">{pendingJobs}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="favorites"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white gap-1.5 px-4"
              >
                <Star className="w-3.5 h-3.5" />
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
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>
        </div>

        {/* Job Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 bg-card/50 border-border/50 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--gradient-dark))]/20 rounded-2xl">
                  <Image className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-xl font-semibold">
                {searchQuery ? "No jobs found" : "Start Your Portfolio"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Add your first wrap job to start building your portfolio gallery."}
              </p>
              {!searchQuery && (
                <Button 
                  className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--gradient-dark))]"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
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
