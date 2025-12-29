// MightyCommandAI Vehicle SqFt Engine
// Single source of truth for all vehicle square footage lookups
// Used by: vehicle-sqft edge function, submit-quote, Jordan, Luigi

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface VehicleSqFtResult {
  sqft: number;
  panels?: {
    sides: number;
    back: number;
    hood: number;
    roof: number;
  };
  source: 'database' | 'quick_ref' | 'category_estimate';
}

// TOP 25 MOST QUOTED VEHICLES - QUICK REFERENCE (fallback)
const VEHICLE_QUICK_REF: Record<string, { sqft: number; category: string }> = {
  // CARS
  'honda_civic': { sqft: 200, category: 'car' },
  'toyota_camry': { sqft: 220, category: 'car' },
  'chevy_impala': { sqft: 260, category: 'car' },
  'chevrolet_impala': { sqft: 260, category: 'car' },
  'ford_mustang': { sqft: 210, category: 'car' },
  'dodge_charger': { sqft: 240, category: 'car' },
  'chevy_camaro': { sqft: 200, category: 'car' },
  'chevrolet_camaro': { sqft: 200, category: 'car' },
  'tesla_model_3': { sqft: 200, category: 'car' },
  'tesla_model_y': { sqft: 220, category: 'suv' },
  'tesla_model_s': { sqft: 230, category: 'car' },
  'tesla_model_x': { sqft: 250, category: 'suv' },
  
  // TRUCKS
  'ford_f-150': { sqft: 250, category: 'truck' },
  'ford_f150': { sqft: 250, category: 'truck' },
  'chevy_silverado': { sqft: 260, category: 'truck' },
  'chevrolet_silverado': { sqft: 260, category: 'truck' },
  'ram_1500': { sqft: 255, category: 'truck' },
  'toyota_tacoma': { sqft: 220, category: 'truck' },
  'toyota_tundra': { sqft: 260, category: 'truck' },
  'ford_f-250': { sqft: 280, category: 'truck' },
  'ford_f250': { sqft: 280, category: 'truck' },
  'ford_f-350': { sqft: 300, category: 'truck' },
  'ford_f350': { sqft: 300, category: 'truck' },
  'gmc_sierra': { sqft: 260, category: 'truck' },
  
  // VANS
  'ford_transit': { sqft: 250, category: 'van' },
  'mercedes_sprinter': { sqft: 260, category: 'van' },
  'nissan_nv200': { sqft: 180, category: 'van' },
  'ram_promaster': { sqft: 260, category: 'van' },
  'chevy_express': { sqft: 280, category: 'van' },
  'chevrolet_express': { sqft: 280, category: 'van' },
  
  // SUVs
  'chevy_tahoe': { sqft: 240, category: 'suv' },
  'chevrolet_tahoe': { sqft: 240, category: 'suv' },
  'ford_explorer': { sqft: 220, category: 'suv' },
  'jeep_grand_cherokee': { sqft: 200, category: 'suv' },
  'jeep_wrangler': { sqft: 180, category: 'suv' },
  'ford_bronco': { sqft: 200, category: 'suv' },
  'chevy_suburban': { sqft: 280, category: 'suv' },
  'chevrolet_suburban': { sqft: 280, category: 'suv' },
  'gmc_yukon': { sqft: 250, category: 'suv' },
  'cadillac_escalade': { sqft: 280, category: 'suv' },
  'honda_cr-v': { sqft: 200, category: 'suv' },
  'honda_crv': { sqft: 200, category: 'suv' },
  'toyota_4runner': { sqft: 220, category: 'suv' },
  'acura_mdx': { sqft: 220, category: 'suv' },
};

// Category-based fallback estimates
const CATEGORY_ESTIMATES: Record<string, number> = {
  'car': 210,
  'sedan': 220,
  'coupe': 190,
  'truck': 250,
  'suv': 220,
  'van': 240,
  'commercial': 280,
  'sports': 200,
  'luxury': 230,
};

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');
}

function getQuickRefSqft(make: string, model: string): VehicleSqFtResult | null {
  const normalizedMake = normalizeString(make);
  const normalizedModel = normalizeString(model);
  
  // Try exact match
  const key = `${normalizedMake}_${normalizedModel}`;
  if (VEHICLE_QUICK_REF[key]) {
    return {
      sqft: VEHICLE_QUICK_REF[key].sqft,
      source: 'quick_ref',
    };
  }
  
  // Try model only (for common vehicles)
  for (const [refKey, data] of Object.entries(VEHICLE_QUICK_REF)) {
    if (refKey.includes(normalizedModel) || refKey.endsWith(`_${normalizedModel}`)) {
      return {
        sqft: data.sqft,
        source: 'quick_ref',
      };
    }
  }
  
  return null;
}

// REMOVED: Category estimate fallback - was causing incorrect pricing
// function getCategoryEstimate is no longer used

/**
 * Get vehicle square footage from the authoritative database.
 * Falls back to quick reference, then category estimates.
 * 
 * @param supabase - Supabase client instance
 * @param year - Vehicle year (number or string)
 * @param make - Vehicle make (e.g., "Ford", "Toyota")
 * @param model - Vehicle model (e.g., "F-150", "Camry")
 * @param category - Optional category for fallback estimates
 * @returns VehicleSqFtResult with sqft, panels, and source
 */
export async function getVehicleSqFt(
  supabase: SupabaseClient,
  year: number | string,
  make: string,
  model: string,
  category?: string
): Promise<VehicleSqFtResult | null> {
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  
  // 1. Try database lookup (authoritative source)
  try {
    const { data, error } = await supabase
      .from('vehicle_dimensions')
      .select('corrected_sqft, side_sqft, back_sqft, hood_sqft, roof_sqft, year_start, year_end')
      .ilike('make', make.trim())
      .ilike('model', model.trim())
      .lte('year_start', yearNum)
      .gte('year_end', yearNum)
      .limit(1)
      .single();
    
    if (data && !error && data.corrected_sqft) {
      console.log(`[MightySqFt] Database hit: ${year} ${make} ${model} = ${data.corrected_sqft} sqft`);
      return {
        sqft: data.corrected_sqft,
        panels: {
          sides: data.side_sqft || 0,
          back: data.back_sqft || 0,
          hood: data.hood_sqft || 0,
          roof: data.roof_sqft || 0,
        },
        source: 'database',
      };
    }
  } catch (err) {
    console.warn(`[MightySqFt] Database lookup error:`, err);
  }
  
  // 2. Try quick reference (top 25 vehicles)
  const quickRef = getQuickRefSqft(make, model);
  if (quickRef) {
    console.log(`[MightySqFt] Quick ref hit: ${year} ${make} ${model} = ${quickRef.sqft} sqft`);
    return quickRef;
  }
  
  // 3. NO MATCH - Return null instead of silent fallback
  console.warn(`[MightySqFt] NO MATCH - Vehicle not in database or quick_ref`, {
    vehicle: { year, make, model },
    category,
    action: 'Returning null - caller must handle'
  });
  return null;
}

/**
 * Create a Supabase client for edge functions.
 * Uses service role key for full access.
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
