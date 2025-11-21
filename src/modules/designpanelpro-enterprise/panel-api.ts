import { supabase } from "@/integrations/supabase/client";

export interface DesignPanel {
  id: string;
  user_id: string;
  organization_id?: string;
  vehicle_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  style: string;
  substyle?: string;
  intensity?: string;
  width_inches: number;
  height_inches: number;
  thumbnail_url?: string;
  panel_preview_url: string;
  panel_3d_url?: string;
  tiff_url?: string;
  metadata?: any;
  folder_id?: string;
  tags?: string[];
  is_template: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignPanelFolder {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  color?: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DesignPanelVersion {
  id: string;
  panel_id: string;
  version_number: number;
  panel_preview_url: string;
  panel_3d_url?: string;
  tiff_url?: string;
  changes_description?: string;
  metadata?: any;
  created_at: string;
}

export interface SavePanelParams {
  vehicle_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  style: string;
  substyle?: string;
  intensity?: string;
  width_inches: number;
  height_inches: number;
  panel_preview_url: string;
  panel_3d_url?: string;
  tiff_url?: string;
  metadata?: any;
  tags?: string[];
  folder_id?: string;
}

export async function saveDesignPanel(params: SavePanelParams) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from('design_panels')
    .insert({
      user_id: user.id,
      ...params
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDesignPanels(filters?: {
  vehicle_id?: string;
  style?: string;
  folder_id?: string;
  tags?: string[];
  search?: string;
}) {
  let query = supabase
    .from('design_panels')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.vehicle_id) {
    query = query.eq('vehicle_id', filters.vehicle_id);
  }

  if (filters?.style) {
    query = query.eq('style', filters.style);
  }

  if (filters?.folder_id) {
    query = query.eq('folder_id', filters.folder_id);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as DesignPanel[];
}

export async function fetchDesignPanelById(id: string) {
  const { data, error } = await supabase
    .from('design_panels')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DesignPanel;
}

export async function updateDesignPanel(id: string, updates: Partial<SavePanelParams>) {
  const { data, error } = await supabase
    .from('design_panels')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDesignPanel(id: string) {
  const { error } = await supabase
    .from('design_panels')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createFolder(name: string, description?: string, color?: string, parentId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from('design_panel_folders')
    .insert({
      user_id: user.id,
      name,
      description,
      color,
      parent_folder_id: parentId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchFolders() {
  const { data, error } = await supabase
    .from('design_panel_folders')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as DesignPanelFolder[];
}

export async function createVersion(
  panelId: string,
  versionNumber: number,
  panelPreviewUrl: string,
  panel3dUrl?: string,
  tiffUrl?: string,
  changesDescription?: string,
  metadata?: any
) {
  const { data, error } = await supabase
    .from('design_panel_versions')
    .insert({
      panel_id: panelId,
      version_number: versionNumber,
      panel_preview_url: panelPreviewUrl,
      panel_3d_url: panel3dUrl,
      tiff_url: tiffUrl,
      changes_description: changesDescription,
      metadata
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchVersions(panelId: string) {
  const { data, error } = await supabase
    .from('design_panel_versions')
    .select('*')
    .eq('panel_id', panelId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data as DesignPanelVersion[];
}
