import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { VehicleFormData } from "./api";

type VehicleModel = Database["public"]["Tables"]["vehicle_models"]["Row"];

interface VehicleEditorProps {
  open: boolean;
  vehicle: VehicleModel | null;
  onClose: () => void;
  onSave: (data: VehicleFormData) => Promise<void>;
  onUploadThumbnail: (file: File) => Promise<string>;
}

export function VehicleEditor({
  open,
  vehicle,
  onClose,
  onSave,
  onUploadThumbnail,
}: VehicleEditorProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    make: "",
    model: "",
    year: "",
    body_type: "",
    category: "sedan",
    angle_front: "front 3/4 view, 45-degree angle",
    angle_side: "side profile view, 90-degree angle",
    angle_rear: "rear 3/4 view, 45-degree angle",
    angle_front_close: "front close-up view, straight on",
    render_prompt: "",
    default_finish: "gloss",
    default_environment: "studio",
    thumbnail_url: "",
    is_active: true,
    is_oem: false,
    is_featured: false,
    is_hidden: false,
    sort_order: 0,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        body_type: vehicle.body_type || "",
        category: vehicle.category || "sedan",
        angle_front: vehicle.angle_front || "front 3/4 view, 45-degree angle",
        angle_side: vehicle.angle_side || "side profile view, 90-degree angle",
        angle_rear: vehicle.angle_rear || "rear 3/4 view, 45-degree angle",
        angle_front_close: vehicle.angle_front_close || "front close-up view, straight on",
        render_prompt: vehicle.render_prompt || "",
        default_finish: vehicle.default_finish || "gloss",
        default_environment: vehicle.default_environment || "studio",
        thumbnail_url: vehicle.thumbnail_url || "",
        is_active: vehicle.is_active ?? true,
        is_oem: vehicle.is_oem ?? false,
        is_featured: vehicle.is_featured ?? false,
        is_hidden: vehicle.is_hidden ?? false,
        sort_order: vehicle.sort_order ?? 0,
      });
    } else {
      setFormData({
        make: "",
        model: "",
        year: "",
        body_type: "",
        category: "sedan",
        angle_front: "front 3/4 view, 45-degree angle",
        angle_side: "side profile view, 90-degree angle",
        angle_rear: "rear 3/4 view, 45-degree angle",
        angle_front_close: "front close-up view, straight on",
        render_prompt: "",
        default_finish: "gloss",
        default_environment: "studio",
        thumbnail_url: "",
        is_active: true,
        is_oem: false,
        is_featured: false,
        is_hidden: false,
        sort_order: 0,
      });
    }
  }, [vehicle]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await onUploadThumbnail(file);
      setFormData({ ...formData, thumbnail_url: url });
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="angles">Camera Angles</TabsTrigger>
              <TabsTrigger value="defaults">Defaults</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Make*</Label>
                  <Input
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model*</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year*</Label>
                  <Input
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Body Type</Label>
                  <Input
                    value={formData.body_type}
                    onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                    placeholder="e.g., Sedan, SUV, Truck"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="coupe">Coupe</option>
                    <option value="exotic">Exotic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-4">
                  {formData.thumbnail_url && (
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}
                  <label className="cursor-pointer">
                    <div className="px-4 py-2 rounded-md border bg-secondary hover:bg-secondary/80 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading..." : "Upload Thumbnail"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="angles" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Front Angle Prompt</Label>
                <Textarea
                  value={formData.angle_front}
                  onChange={(e) => setFormData({ ...formData, angle_front: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Side Angle Prompt</Label>
                <Textarea
                  value={formData.angle_side}
                  onChange={(e) => setFormData({ ...formData, angle_side: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Rear Angle Prompt</Label>
                <Textarea
                  value={formData.angle_rear}
                  onChange={(e) => setFormData({ ...formData, angle_rear: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Front Close Angle Prompt</Label>
                <Textarea
                  value={formData.angle_front_close}
                  onChange={(e) => setFormData({ ...formData, angle_front_close: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Custom Render Prompt</Label>
                <Textarea
                  value={formData.render_prompt}
                  onChange={(e) => setFormData({ ...formData, render_prompt: e.target.value })}
                  rows={3}
                  placeholder="Additional rendering instructions..."
                />
              </div>
            </TabsContent>

            <TabsContent value="defaults" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Finish</Label>
                  <select
                    value={formData.default_finish}
                    onChange={(e) => setFormData({ ...formData, default_finish: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  >
                    <option value="gloss">Gloss</option>
                    <option value="satin">Satin</option>
                    <option value="matte">Matte</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Default Environment</Label>
                  <select
                    value={formData.default_environment}
                    onChange={(e) => setFormData({ ...formData, default_environment: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  >
                    <option value="studio">Studio</option>
                    <option value="white">White Cyclorama</option>
                    <option value="desert">Desert</option>
                    <option value="city">City</option>
                    <option value="garage">Garage</option>
                    <option value="showroom">Showroom</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Show in vehicle selector
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured</Label>
                    <p className="text-sm text-muted-foreground">
                      Show at top of list
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_featured: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hidden</Label>
                    <p className="text-sm text-muted-foreground">
                      Hide from standard users
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_hidden}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_hidden: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>OEM Model</Label>
                    <p className="text-sm text-muted-foreground">
                      Official manufacturer data (locked)
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_oem}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_oem: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
