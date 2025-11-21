import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type VehicleModel = Database["public"]["Tables"]["vehicle_models"]["Row"];
type VehicleInsert = Database["public"]["Tables"]["vehicle_models"]["Insert"];
type VehicleUpdate = Database["public"]["Tables"]["vehicle_models"]["Update"];

export interface VehicleFormData {
  make: string;
  model: string;
  year: string;
  body_type?: string;
  category?: string;
  angle_front?: string;
  angle_side?: string;
  angle_rear?: string;
  angle_front_close?: string;
  render_prompt?: string;
  default_finish?: string;
  default_environment?: string;
  thumbnail_url?: string;
  is_active?: boolean;
  is_oem?: boolean;
  is_featured?: boolean;
  is_hidden?: boolean;
  sort_order?: number;
  panel_geometry?: any;
}

export async function fetchAllVehicles(): Promise<VehicleModel[]> {
  const { data, error } = await supabase
    .from("vehicle_models")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("make", { ascending: true })
    .order("model", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchVehicleById(id: string): Promise<VehicleModel> {
  const { data, error } = await supabase
    .from("vehicle_models")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createVehicle(vehicle: VehicleFormData): Promise<VehicleModel> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const insertData: VehicleInsert = {
    ...vehicle,
    created_by: user?.id || null,
  };

  const { data, error } = await supabase
    .from("vehicle_models")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicle(id: string, vehicle: Partial<VehicleFormData>): Promise<VehicleModel> {
  const updateData: VehicleUpdate = {
    ...vehicle,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("vehicle_models")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from("vehicle_models")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadVehicleThumbnail(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `vehicle-thumbnails/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("design-vault")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("design-vault")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
