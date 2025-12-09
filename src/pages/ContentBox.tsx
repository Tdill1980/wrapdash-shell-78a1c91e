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
  Grid,
  LayoutList,
  FolderSync,
  Wand2,
  Scissors,
  Target,
  Repeat,
  Link2
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

// Components
import { SourceIntegrationsPanel } from "@/components/contentbox/SourceIntegrationsPanel";
import { AIVideoEditor } from "@/components/contentbox/AIVideoEditor";
import { AdCreator } from "@/components/contentbox/AdCreator";
import { ContentRepurposer } from "@/components/contentbox/ContentRepurposer";

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

const STYLE_MODIFIERS = [
  { value: 'none', label: 'No Style Modifier', description: 'Pure brand voice' },
  { value: 'garyvee', label: 'Gary Vee', description: 'Raw, authentic, founder POV' },
  { value: 'sabrisuby', label: 'Sabri Suby', description: 'Direct response, conversion-focused' },
  { value: 'daradenney', label: 'Dara Denney', description: 'UGC, paid social, storytelling' },
];

function MediaCard({ file, onSelect, selected }: { file: ContentFile; onSelect: (file: ContentFile) => void; selected?: boolean }) {
  const isVideo = file.file_type === 'video' || file.file_type === 'reel';
  
  return (
    <Card 
      className={`bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group overflow-hidden ${
        selected ? 'ring-2 ring-primary border-primary' : ''
      }`}
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
  const [styleModifier, setStyleModifier] = useState('none');
  const [additionalContext, setAdditionalContext] = useState('');
  const [autoTransform, setAutoTransform] = useState(false);

  const hasMismatch = selectedFiles.some(f => f.brand !== brand);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <option value="software">WrapCommand AI / RestylePro</option>
            </select>
          </div>

          {hasMismatch && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-400">Brand Mismatch Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Some selected media was tagged for a different brand
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-muted-foreground">Auto-Transform</span>
                  <button
                    type="button"
                    onClick={() => setAutoTransform(!autoTransform)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      autoTransform ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        autoTransform ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>
              {autoTransform && (
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  Content will be automatically transformed to match {brand.toUpperCase()} brand style
                </p>
              )}
            </div>
          )}

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
            <label className="text-sm font-medium">Creative Style</label>
            <select
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border"
              value={styleModifier}
              onChange={(e) => setStyleModifier(e.target.value)}
            >
              {STYLE_MODIFIERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.description}
                </option>
              ))}
            </select>
            {styleModifier !== 'none' && (
              <p className="text-xs text-muted-foreground mt-1">
                {styleModifier === 'garyvee' && '🔥 Raw, punchy founder energy with cultural insight'}
                {styleModifier === 'sabrisuby' && '💰 Hardcore direct-response with PAS framework'}
                {styleModifier === 'daradenney' && '✨ Modern UGC storytelling optimized for paid social'}
              </p>
            )}
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
                style: styleModifier,
                media_urls: selectedFiles.map(f => f.file_url),
                tags: selectedFiles.flatMap(f => f.tags || []),
                additional_context: additionalContext,
                auto_transform: autoTransform
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
  
  const byDate = calendar?.reduce((acc, entry) => {
    const date = entry.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ContentCalendarEntry[]>) || {};

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
    generateCalendar,
    processVideo,
    generateAd,
    repurposeContent
  } = useContentBox();

  const [selectedFiles, setSelectedFiles] = useState<ContentFile[]>([]);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('library');
  const [creatorTab, setCreatorTab] = useState('video-editor');
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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

  const handleConnectSource = (source: string) => {
    toast.info(`${source} integration coming soon!`);
  };

  const handleSyncSource = async (source: string) => {
    setSyncingSource(source);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncingSource(null);
    toast.info(`${source} sync coming soon!`);
  };

  const handleVideoProcess = async (action: string, params: Record<string, unknown>) => {
    setProcessing(true);
    try {
      const result = await processVideo.mutateAsync({
        action,
        file_id: params.file_id as string,
        file_url: params.file_url as string,
        trim_start: params.trim_start as number,
        trim_end: params.trim_end as number,
        brand: params.brand as string
      });
      return result;
    } finally {
      setProcessing(false);
    }
  };

  const handleAdGenerate = async (params: Record<string, unknown>) => {
    setProcessing(true);
    try {
      const result = await generateAd.mutateAsync({
        brand: params.brand as string || 'wpw',
        objective: params.objective as string || params.ad_type as string,
        platform: params.platform as string,
        format: params.format as string,
        media_urls: params.media_urls as string[],
        headline: params.headline as string,
        cta: params.cta as string
      });
      return result;
    } finally {
      setProcessing(false);
    }
  };

  const handleRepurpose = async (params: Record<string, unknown>) => {
    setProcessing(true);
    try {
      const result = await repurposeContent.mutateAsync({
        brand: params.brand as string || 'wpw',
        source_url: params.source_url as string || params.file_url as string,
        source_type: params.source_type as string || 'video',
        source_transcript: params.source_transcript as string,
        target_formats: params.target_formats as string[] || params.formats as string[],
        enhancements: params.enhancements as string[]
      });
      return result;
    } finally {
      setProcessing(false);
    }
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
            AI-powered content creation • Video editing • Ad generation • Repurposing
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="library">
            <Grid className="w-4 h-4 mr-2" /> Library
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Link2 className="w-4 h-4 mr-2" /> Sources
          </TabsTrigger>
          <TabsTrigger value="create">
            <Wand2 className="w-4 h-4 mr-2" /> AI Create
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Sparkles className="w-4 h-4 mr-2" /> Projects
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" /> Calendar
          </TabsTrigger>
        </TabsList>

        {/* Media Library Tab */}
        <TabsContent value="library" className="space-y-4">
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
                {filteredFiles.length} files • {selectedFiles.length} selected
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
                <MediaCard 
                  key={file.id}
                  file={file} 
                  onSelect={toggleFileSelection}
                  selected={selectedFiles.some(f => f.id === file.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Source Integrations Tab */}
        <TabsContent value="sources" className="space-y-4">
          <SourceIntegrationsPanel
            onConnect={handleConnectSource}
            onSync={handleSyncSource}
            syncing={syncingSource}
          />
        </TabsContent>

        {/* AI Create Tab */}
        <TabsContent value="create" className="space-y-4">
          <Tabs value={creatorTab} onValueChange={setCreatorTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="video-editor">
                <Scissors className="w-4 h-4 mr-2" /> Video Editor
              </TabsTrigger>
              <TabsTrigger value="ad-creator">
                <Target className="w-4 h-4 mr-2" /> Ad Creator
              </TabsTrigger>
              <TabsTrigger value="repurposer">
                <Repeat className="w-4 h-4 mr-2" /> Repurposer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video-editor">
              <AIVideoEditor
                selectedFile={selectedFiles[0] || null}
                onProcess={handleVideoProcess}
                processing={processing}
              />
            </TabsContent>

            <TabsContent value="ad-creator">
              <AdCreator
                selectedFiles={selectedFiles}
                onGenerate={handleAdGenerate}
                generating={processing}
              />
            </TabsContent>

            <TabsContent value="repurposer">
              <ContentRepurposer
                selectedFile={selectedFiles[0] || null}
                onRepurpose={handleRepurpose}
                processing={processing}
              />
            </TabsContent>
          </Tabs>

          {selectedFiles.length === 0 && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <p className="text-center text-muted-foreground text-sm">
                Select media from the <strong>Library</strong> tab first, then come back to create content
              </p>
            </Card>
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
          <div className="flex justify-end mb-4">
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
          </div>
          <CalendarView calendar={calendar || []} />
        </TabsContent>
      </Tabs>

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
