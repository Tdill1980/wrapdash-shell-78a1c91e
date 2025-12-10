import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Upload, Image, Video, Music, Folder, 
  Grid3X3, List, Filter, X, Play, Download, Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaUploader } from "./MediaUploader";
import { MediaCard } from "./MediaCard";

interface MediaFile {
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
  onSelect?: (file: MediaFile) => void;
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

  const handleFileSelect = (file: MediaFile) => {
    if (selectionMode && onSelect) {
      onSelect(file);
    } else {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Media Library</h2>
        <Button onClick={() => setShowUploader(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <MediaUploader 
          onClose={() => setShowUploader(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files, tags, or use AI search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList>
            {FILTER_TYPES.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="gap-2">
                <type.icon className="w-4 h-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Count */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <span className="text-sm">
            {selectedFiles.length} file(s) selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedFiles([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Files Grid/List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading media files...
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No files found</p>
            <Button className="mt-4" onClick={() => setShowUploader(true)}>
              Upload Your First File
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <MediaCard
              key={file.id}
              file={file}
              selected={selectedFiles.includes(file.id)}
              onClick={() => handleFileSelect(file)}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedFiles.includes(file.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                {file.thumbnail_url || file.file_type === "image" ? (
                  <img
                    src={file.thumbnail_url || file.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : file.file_type === "video" ? (
                  <Play className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Music className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
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
              {file.tags && file.tags.length > 0 && (
                <div className="flex gap-1">
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
