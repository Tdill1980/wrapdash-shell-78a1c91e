import React, { useState, useCallback } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useContentBox, ContentFile, ContentProject, ContentCalendarEntry } from "@/hooks/useContentBox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Upload, 
  Instagram, 
  Calendar, 
  Sparkles, 
  Loader2, 
  Image, 
  Video, 
  Play,
  Filter,
  Grid,
  LayoutList,
  RefreshCw,
  FolderSync,
  Wand2
} from "lucide-react";
import { useDropzone } from "react-dropzone";

const BRANDS = [
  { value: 'all', label: 'All Brands' },
  { value: 'wpw', label: 'WePrintWraps' },
  { value: 'wraptv', label: 'WrapTV' },
  { value: 'inkandedge', label: 'Ink & Edge' },
];

const CONTENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'reel', label: 'Reels' },
];

const GOALS = [
  { value: 'sell', label: 'Sell' },
  { value: 'educate', label: 'Educate' },
  { value: 'entertain', label: 'Entertain' },
  { value: 'hype', label: 'Hype' },
  { value: 'convert', label: 'Convert' },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
];

function MediaCard({ file, onSelect }: { file: ContentFile; onSelect: (file: ContentFile) => void }) {
  const isVideo = file.file_type === 'video' || file.file_type === 'reel';
  
  return (
    <Card 
      className="bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group overflow-hidden"
      onClick={() => onSelect(file)}
    >
      <div className="aspect-square relative overflow-hidden">
        {isVideo ? (
          <>
            <img 
              src={file.thumbnail_url || file.file_url} 
              alt={file.original_filename || 'Media'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-12 h-12 text-white" />
            </div>
          </>
        ) : (
          <img 
            src={file.file_url} 
            alt={file.original_filename || 'Media'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        )}
        
        <div className="absolute top-2 left-2">
          <Badge className="bg-black/60 text-white text-xs">
            {file.brand.toUpperCase()}
          </Badge>
        </div>
        
        <div className="absolute top-2 right-2">
          {isVideo ? (
            <Video className="w-4 h-4 text-white drop-shadow" />
          ) : (
            <Image className="w-4 h-4 text-white drop-shadow" />
          )}
        </div>
        
        {file.processing_status === 'pending' && (
          <div className="absolute bottom-2 right-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex flex-wrap gap-1">
          {file.tags?.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(file.tags?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs">
              +{file.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GeneratorModal({ 
  open, 
  onClose, 
  selectedFiles,
  onGenerate,
  generating 
}: { 
  open: boolean; 
  onClose: () => void;
  selectedFiles: ContentFile[];
  onGenerate: (params: Record<string, unknown>) => void;
  generating: boolean;
}) {
  const [brand, setBrand] = useState('wpw');
  const [contentType, setContentType] = useState('reel');
  const [goal, setGoal] = useState('sell');
  const [platform, setPlatform] = useState('instagram');
  const [additionalContext, setAdditionalContext] = useState('');

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Content Pack
          </DialogTitle>
          <DialogDescription>
            Create AI-powered content from {selectedFiles.length} selected media file(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Brand</label>
            <select
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              {BRANDS.filter(b => b.value !== 'all').map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Content Type</label>
            <select
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="reel">Reel</option>
              <option value="static">Static Post</option>
              <option value="carousel">Carousel</option>
              <option value="thumbnail">Thumbnail</option>
              <option value="story">Story</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Goal</label>
            <select
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Platform</label>
            <select
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Additional Context (optional)</label>
            <textarea
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border min-h-[80px]"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Add any specific details about the content..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => onGenerate({
                brand,
                content_type: contentType,
                goal,
                platform,
                media_urls: selectedFiles.map(f => f.file_url),
                tags: selectedFiles.flatMap(f => f.tags || []),
                additional_context: additionalContext
              })}
              className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" /> Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CalendarView({ calendar }: { calendar: ContentCalendarEntry[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  // Group by date
  const byDate = calendar?.reduce((acc, entry) => {
    const date = entry.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ContentCalendarEntry[]>) || {};

  // Get next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => (
        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
          {day}
        </div>
      ))}
      {dates.map(date => {
        const entries = byDate[date] || [];
        const d = new Date(date);
        const isToday = date === today.toISOString().split('T')[0];
        
        return (
          <Card 
            key={date} 
            className={`p-2 min-h-[100px] ${isToday ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="text-xs font-medium mb-1">
              {d.getDate()}
            </div>
            <div className="space-y-1">
              {entries.map(entry => (
                <div 
                  key={entry.id}
                  className={`text-xs p-1 rounded truncate ${
                    entry.brand === 'wpw' ? 'bg-blue-500/20 text-blue-400' :
                    entry.brand === 'wraptv' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {entry.title || entry.content_type}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function ContentBox() {
  const { 
    files, 
    projects, 
    calendar, 
    isLoading, 
    uploadFile,
    generateContent,
    syncInstagram,
    generateCalendar
  } = useContentBox();

  const [selectedFiles, setSelectedFiles] = useState<ContentFile[]>([]);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      uploadFile.mutate({ file, brand: brandFilter === 'all' ? 'wpw' : brandFilter });
    });
  }, [uploadFile, brandFilter]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    }
  });

  const filteredFiles = files?.filter(f => {
    if (brandFilter !== 'all' && f.brand !== brandFilter) return false;
    if (typeFilter !== 'all' && f.file_type !== typeFilter) return false;
    return true;
  }) || [];

  const toggleFileSelection = (file: ContentFile) => {
    setSelectedFiles(prev => {
      const exists = prev.find(f => f.id === file.id);
      if (exists) return prev.filter(f => f.id !== file.id);
      return [...prev, file];
    });
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">
              ContentBox
            </span>
            <span className="text-foreground">AI</span>
          </h1>
          <p className="text-muted-foreground">
            Centralized media brain for WPW • WrapTV • Ink & Edge
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => syncInstagram.mutate({ brand: brandFilter === 'all' ? 'wpw' : brandFilter })}
            disabled={syncInstagram.isPending}
          >
            {syncInstagram.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Instagram className="w-4 h-4 mr-2" />
            )}
            Sync Instagram
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => generateCalendar.mutate({ weeks_ahead: 2 })}
            disabled={generateCalendar.isPending}
          >
            {generateCalendar.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Generate Calendar
          </Button>
          
          {selectedFiles.length > 0 && (
            <Button 
              className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
              onClick={() => setGeneratorOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate ({selectedFiles.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="library" className="space-y-4">
        <TabsList>
          <TabsTrigger value="library">
            <Grid className="w-4 h-4 mr-2" /> Media Library
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Sparkles className="w-4 h-4 mr-2" /> Content Projects
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" /> Content Calendar
          </TabsTrigger>
        </TabsList>

        {/* Media Library Tab */}
        <TabsContent value="library" className="space-y-4">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-foreground font-medium">
              {isDragActive ? 'Drop files here...' : 'Drag & drop media files'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              or click to browse
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select
                className="bg-muted text-foreground p-2 rounded-md border border-border text-sm"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                {BRANDS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
              
              <select
                className="bg-muted text-foreground p-2 rounded-md border border-border text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredFiles.length} files
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <LayoutList className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Media Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderSync className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium">No media files yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Upload files or sync from Instagram to get started
              </p>
            </Card>
          ) : (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'}`}>
              {filteredFiles.map(file => (
                <div 
                  key={file.id}
                  className={`relative ${selectedFiles.find(f => f.id === file.id) ? 'ring-2 ring-primary rounded-lg' : ''}`}
                >
                  <MediaCard file={file} onSelect={toggleFileSelection} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Content Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {projects?.length === 0 ? (
            <Card className="p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium">No content projects yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Select media and generate content to create projects
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects?.map(project => (
                <Card key={project.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge>{project.brand.toUpperCase()}</Badge>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <h3 className="font-medium text-foreground mb-2">
                    {project.project_type} • {project.platform}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.ai_brief}
                  </p>
                  {project.ai_output && (
                    <div className="mt-3 space-y-1">
                      {(project.ai_output as { hooks?: string[] }).hooks?.slice(0, 1).map((hook, i) => (
                        <p key={i} className="text-xs text-primary italic">"{hook}"</p>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <CalendarView calendar={calendar || []} />
        </TabsContent>
      </Tabs>

      {/* Generator Modal */}
      <GeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        selectedFiles={selectedFiles}
        onGenerate={async (params) => {
          await generateContent.mutateAsync(params as Parameters<typeof generateContent.mutateAsync>[0]);
          setGeneratorOpen(false);
          setSelectedFiles([]);
        }}
        generating={generateContent.isPending}
      />
    </MainLayout>
  );
}
