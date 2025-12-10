import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Upload, Image, Video, Music, Folder, 
  Grid3X3, List, X, Play, Download, Trash2, Camera
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaUploader } from "./MediaUploader";
import { MediaCard, MediaSelectMode } from "./MediaCard";

export interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  original_filename: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  brand: string;
  created_at: string;
  duration_seconds: number | null;
}

const FILTER_TYPES = [
  { id: "all", label: "All", icon: Grid3X3 },
  { id: "image", label: "Images", icon: Image },
  { id: "video", label: "Videos", icon: Video },
  { id: "audio", label: "Audio", icon: Music },
];

export function MediaLibrary({ 
  onSelect,
  selectionMode = false 
}: { 
  onSelect?: (file: MediaFile, mode?: MediaSelectMode) => void;
  selectionMode?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["media-library", filterType],
    queryFn: async () => {
      let query = supabase
        .from("content_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("file_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MediaFile[];
    },
  });

  const filteredFiles = files.filter((file) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      file.original_filename?.toLowerCase().includes(searchLower) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleFileSelect = (file: MediaFile, mode?: MediaSelectMode) => {
    if (onSelect) {
      onSelect(file, mode);
    }
    
    if (!selectionMode) {
      setSelectedFiles((prev) =>
        prev.includes(file.id)
          ? prev.filter((id) => id !== file.id)
          : [...prev, file.id]
      );
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Header - Mobile Responsive */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">Media Library</h2>
        <Button onClick={() => setShowUploader(true)} size="sm" className="sm:size-default">
          <Upload className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <MediaUploader 
          onClose={() => setShowUploader(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Filters - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Type Filters - Scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Tabs value={filterType} onValueChange={setFilterType}>
            <TabsList className="h-10">
              {FILTER_TYPES.map((type) => (
                <TabsTrigger 
                  key={type.id} 
                  value={type.id} 
                  className="gap-1.5 px-2.5 sm:px-3 min-w-[44px]"
                >
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* View Mode Toggle */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selected Count - Mobile Responsive */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm">
            {selectedFiles.length} file(s) selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-9">
              <Download className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button size="sm" variant="destructive" className="h-9">
              <Trash2 className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => setSelectedFiles([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Files Grid/List - Mobile Responsive */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading media files...
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No files found</p>
            <Button className="w-full sm:w-auto" onClick={() => setShowUploader(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First File
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* 2 columns on mobile, 4 on tablet, 6 on desktop */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredFiles.map((file) => (
            <MediaCard
              key={file.id}
              file={file}
              selected={selectedFiles.includes(file.id)}
              onClick={handleFileSelect}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-3 sm:gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedFiles.includes(file.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {file.thumbnail_url || file.file_type === "image" ? (
                  <img
                    src={file.thumbnail_url || file.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : file.file_type === "video" ? (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                ) : (
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {file.original_filename || "Untitled"}
                </p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {file.file_type}
                  </Badge>
                  {file.duration_seconds && (
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(file.duration_seconds / 60)}:{(file.duration_seconds % 60).toString().padStart(2, "0")}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Hide tags on mobile to save space */}
              {file.tags && file.tags.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {file.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}