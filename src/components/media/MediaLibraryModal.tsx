import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Video,
  Image,
  Grid3X3,
  Check,
  Clock,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MediaFile } from "./MediaLibrary";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (file: MediaFile) => void;
  multiSelect?: boolean;
  onMultiSelect?: (files: MediaFile[]) => void;
  filterType?: "all" | "video" | "image" | "audio";
}

const FILE_TYPES = [
  { id: "all", label: "All", icon: Grid3X3 },
  { id: "video", label: "Videos", icon: Video },
  { id: "image", label: "Images", icon: Image },
];

export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  multiSelect = false,
  onMultiSelect,
  filterType: initialFilterType = "video",
}: MediaLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState(initialFilterType);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["media-library-modal", filterType],
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
    enabled: open,
  });

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;

    const q = searchQuery.toLowerCase();
    return files.filter(
      (file) =>
        file.original_filename?.toLowerCase().includes(q) ||
        file.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  const handleToggleSelect = (file: MediaFile) => {
    if (multiSelect) {
      setSelectedIds((prev) =>
        prev.includes(file.id)
          ? prev.filter((id) => id !== file.id)
          : [...prev, file.id]
      );
    } else {
      onSelect?.(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiSelect && onMultiSelect) {
      const selected = files.filter((f) => selectedIds.includes(f.id));
      onMultiSelect(selected);
    }
    setSelectedIds([]);
    onClose();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select Clips from Media Library</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b space-y-4">
          {/* Search + Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
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

            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <TabsList>
                {FILE_TYPES.map((type) => (
                  <TabsTrigger key={type.id} value={type.id} className="gap-1.5">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {multiSelect && selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} clip(s) selected
              </span>
              <Button size="sm" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px] px-6 py-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading media files...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No files found. Upload videos to your media library first.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => handleToggleSelect(file)}
                    className={cn(
                      "relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-primary/50"
                    )}
                  >
                    <div className="aspect-[9/16] bg-muted relative">
                      {file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url}
                          alt={file.original_filename || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : file.file_type === "video" ? (
                        <video
                          src={file.file_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={file.file_url}
                          alt={file.original_filename || ""}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Duration badge */}
                      {file.duration_seconds && (
                        <Badge
                          variant="secondary"
                          className="absolute bottom-1 right-1 text-[10px] py-0.5 px-1.5 bg-black/70 text-white"
                        >
                          <Clock className="w-3 h-3 mr-0.5" />
                          {formatDuration(file.duration_seconds)}
                        </Badge>
                      )}

                      {/* Selection indicator */}
                      {multiSelect && (
                        <div
                          className={cn(
                            "absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-white/70 bg-black/30"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {multiSelect ? "Click to select" : "Click to add"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate">
                        {file.original_filename || "Untitled"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {multiSelect && (
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedIds.length === 0}
            >
              Add {selectedIds.length} Clip(s)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
