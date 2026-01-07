// ColorPro OS - Render Request Handler
// Sends ONLY canonical identifiers, guards via catalog lookup

import { supabase } from "@/integrations/supabase/client";
import type { ManufacturerKey, ColorProRenderRequest, ColorProRenderResponse } from "@/types/colorpro-os";
import { assertColorProToolKey } from "@/types/colorpro-os";

export interface ColorProFilmSelection {
  manufacturer: ManufacturerKey;
  series: string;
  official_code: string;
}

export interface ColorProVehicle {
  year?: number;
  make: string;
  model: string;
  type: string;
  trim?: string;
}

/**
 * Request a ColorPro render with OS-grade catalog validation
 * The edge function will guard against non-catalog films
 */
export async function requestColorProRender(args: {
  vehicle: ColorProVehicle;
  film: ColorProFilmSelection;
  angle?: 'hero' | 'side' | 'rear' | 'detail';
}): Promise<ColorProRenderResponse> {
  const toolKey = 'colorpro' as const;
  
  // OS invariant check
  assertColorProToolKey(toolKey);

  // Build OS payload with ONLY canonical identifiers
  const payload: ColorProRenderRequest = {
    toolKey,
    vehicle: {
      year: args.vehicle.year,
      make: args.vehicle.make,
      model: args.vehicle.model,
      type: args.vehicle.type,
      trim: args.vehicle.trim,
    },
    film: {
      manufacturer: args.film.manufacturer,
      series: args.film.series,
      official_code: args.film.official_code,
    },
    angle: args.angle || 'hero',
  };

  const { data, error } = await supabase.functions.invoke<ColorProRenderResponse>(
    "generate-colorpro-render",
    { body: payload }
  );

  if (error) {
    console.error("[ColorPro] Render request failed:", error);
    throw error;
  }

  if (!data?.ok) {
    throw new Error(data?.error || "ColorPro render failed");
  }

  return data;
}

/**
 * Build display label from film data
 * Used for UI display, NOT for prompts
 */
export function buildFilmLabel(film: {
  manufacturer: ManufacturerKey;
  series: string;
  official_code: string;
  official_name: string;
}): string {
  return `${film.manufacturer.toUpperCase()} ${film.series.toUpperCase()} ${film.official_code} — ${film.official_name}`;
}
