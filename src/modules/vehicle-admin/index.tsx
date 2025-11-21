import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { VehicleList } from "./VehicleList";
import { VehicleEditor } from "./VehicleEditor";
import {
  fetchAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleThumbnail,
  type VehicleFormData,
} from "./api";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type VehicleModel = Database["public"]["Tables"]["vehicle_models"]["Row"];

export default function VehicleAdmin() {
  const [vehicles, setVehicles] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleModel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await fetchAllVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedVehicle(null);
    setEditorOpen(true);
  };

  const handleEdit = (vehicle: VehicleModel) => {
    setSelectedVehicle(vehicle);
    setEditorOpen(true);
  };

  const handleSave = async (data: VehicleFormData) => {
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, data);
        toast.success("Vehicle updated successfully");
      } else {
        await createVehicle(data);
        toast.success("Vehicle created successfully");
      }
      await loadVehicles();
      setEditorOpen(false);
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save vehicle");
      throw error;
    }
  };

  const handleDeleteRequest = (id: string) => {
    setVehicleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;

    try {
      await deleteVehicle(vehicleToDelete);
      toast.success("Vehicle deleted successfully");
      await loadVehicles();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete vehicle");
    } finally {
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading vehicles...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <VehicleList
        vehicles={vehicles}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onCreate={handleCreate}
      />

      <VehicleEditor
        open={editorOpen}
        vehicle={selectedVehicle}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onUploadThumbnail={uploadVehicleThumbnail}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
