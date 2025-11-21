import { supabase } from "@/integrations/supabase/client";

interface GenerateMasterParams {
  width: string;
  height: string;
  style: string;
  subStyle: string;
  intensity: string;
}

interface Generate3DParams {
  panelUrl: string;
  vehicleModel: string;
}

interface ConvertPrintParams {
  panelUrl: string;
  width: string;
  height: string;
}

export async function generateMasterCanvas(params: GenerateMasterParams) {
  const { data, error } = await supabase.functions.invoke('generate-master', {
    body: params
  });

  if (error) throw error;
  return data;
}

export async function generate3DRender(params: Generate3DParams) {
  const { data, error } = await supabase.functions.invoke('generate-3d', {
    body: params
  });

  if (error) throw error;
  return data;
}

export async function convertToPrint(params: ConvertPrintParams) {
  const { data, error } = await supabase.functions.invoke('convert-print', {
    body: params
  });

  if (error) throw error;
  return data;
}
