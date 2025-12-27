import React, { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSavedViews, SavedView, SavedViewInput } from "@/hooks/useSavedViews";
import { Loader2, Plus, Edit, Trash2, Eye, FolderOpen, Lock, RefreshCw } from "lucide-react";

const SavedViewsAdmin = () => {
  const {
    views,
    isLoading,
    createView,
    updateView,
    deleteView,
    previewView,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSavedViews();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const [previewCounts, setPreviewCounts] = useState<Record<string, number>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetFileType, setTargetFileType] = useState<"video" | "image" | "text" | "any">("any");
  const [filterJsonText, setFilterJsonText] = useState("{}");
  const [sortJsonText, setSortJsonText] = useState("{}");
  const [filterError, setFilterError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTargetFileType("any");
    setFilterJsonText("{}");
    setSortJsonText("{}");
    setFilterError(null);
    setEditingView(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (view: SavedView) => {
    setEditingView(view);
    setName(view.name);
    setDescription(view.description || "");
    setTargetFileType(view.target_file_type);
    setFilterJsonText(JSON.stringify(view.filter_json, null, 2));
    setSortJsonText(JSON.stringify(view.sort_json, null, 2));
    setFilterError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    let filterJson: Record<string, unknown>;
    let sortJson: Record<string, unknown>;

    try {
      filterJson = JSON.parse(filterJsonText);
    } catch {
      setFilterError("Invalid filter JSON");
      return;
    }

    try {
      sortJson = JSON.parse(sortJsonText);
    } catch {
      setFilterError("Invalid sort JSON");
      return;
    }

    const input: SavedViewInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      target_file_type: targetFileType,
      filter_json: filterJson,
      sort_json: sortJson,
    };

    try {
      if (editingView) {
        await updateView(editingView.id, input);
      } else {
        await createView(input);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleDelete = async (view: SavedView) => {
    if (view.is_system) {
      toast.error("System views cannot be deleted");
      return;
    }

    if (!confirm(`Delete "${view.name}"?`)) return;

    try {
      await deleteView(view.id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handlePreview = async (view: SavedView) => {
    setLoadingPreviews((prev) => new Set(prev).add(view.id));
    try {
      const count = await previewView(view);
      setPreviewCounts((prev) => ({ ...prev, [view.id]: count }));
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setLoadingPreviews((prev) => {
        const next = new Set(prev);
        next.delete(view.id);
        return next;
      });
    }
  };

  const getFileTypeBadgeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-purple-600";
      case "image":
        return "bg-blue-600";
      case "text":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Saved Views</h1>
            <p className="text-muted-foreground">Virtual folders for organizing content assets</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create View
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              All Views ({views?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : views?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved views yet. Create one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-28">Preview</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views?.map((view) => (
                    <TableRow key={view.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {view.name}
                          {view.is_system && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFileTypeBadgeColor(view.target_file_type)}>
                          {view.target_file_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]">
                        {view.description || "—"}
                      </TableCell>
                      <TableCell>
                        {previewCounts[view.id] !== undefined ? (
                          <span className="font-medium">{previewCounts[view.id]} assets</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(view)}
                            disabled={loadingPreviews.has(view.id)}
                          >
                            {loadingPreviews.has(view.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Count
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(view)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!view.is_system && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(view)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingView ? "Edit Saved View" : "Create Saved View"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., IG – Finished Wraps"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label>Target File Type</Label>
              <Select value={targetFileType} onValueChange={(v) => setTargetFileType(v as typeof targetFileType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter">Filter JSON</Label>
              <Textarea
                id="filter"
                value={filterJsonText}
                onChange={(e) => {
                  setFilterJsonText(e.target.value);
                  setFilterError(null);
                }}
                placeholder='{"visual_tags.video.has_finished_result": true}'
                className="font-mono text-sm h-32"
              />
              <p className="text-xs text-muted-foreground">
                Use _gte, _lte, _neq suffixes for comparisons
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort">Sort JSON (optional)</Label>
              <Textarea
                id="sort"
                value={sortJsonText}
                onChange={(e) => setSortJsonText(e.target.value)}
                placeholder='{"created_at": "desc"}'
                className="font-mono text-sm h-20"
              />
            </div>

            {filterError && (
              <p className="text-sm text-red-600">{filterError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingView ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SavedViewsAdmin;
