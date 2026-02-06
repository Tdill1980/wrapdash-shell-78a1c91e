// ⚠️ LOVABLE CONNECTION - FOR 3D RENDERS ONLY - DO NOT USE FOR DATA
import { supabase, lovable3DRenders } from "@/integrations/supabase/client";

export interface GeneratePanelParams {
  prompt: string;
  style: string;
  size: 'small' | 'medium' | 'large' | 'xl';
}

export interface Generate3DProofParams {
  vehicle: string;
  panelUrl: string;
  angle?: 'front' | 'side' | 'rear' | 'front-close';
  finish?: 'gloss' | 'satin' | 'matte';
  environment?: 'studio' | 'white' | 'desert' | 'city' | 'garage' | 'showroom';
}

export interface GeneratePrintPackageParams {
  panelUrl: string;
  widthIn: number;
  heightIn: number;
}

export async function generatePanel(params: GeneratePanelParams) {
  const { data, error } = await lovable3DRenders.functions.invoke('generate-panel', {
    body: params
  });

  if (error) throw error;
  return data;
}

export async function generate3DProof(params: Generate3DProofParams) {
  const { data, error } = await lovable3DRenders.functions.invoke('generate-3dproof', {
    body: params
  });

  if (error) throw error;
  return data;
}

export async function generatePrintPackage(params: GeneratePrintPackageParams) {
  const { data, error } = await lovable3DRenders.functions.invoke('generate-printpackage', {
    body: params
  });

  if (error) throw error;
  return data;
}

export function detectVehicleSize(vehicleText: string): 'small' | 'medium' | 'large' | 'xl' {
  const text = vehicleText.toLowerCase();

  if (text.includes("sprinter") || text.includes("van") || text.includes("food truck"))
    return "xl";

  if (text.includes("tundra") || text.includes("sierra") || text.includes("ram") || 
      text.includes("truck") || text.includes("f-150") || text.includes("silverado"))
    return "large";

  if (text.includes("sedan") || text.includes("camry") || text.includes("accord") ||
      text.includes("corolla") || text.includes("civic"))
    return "medium";

  return "small";
}
