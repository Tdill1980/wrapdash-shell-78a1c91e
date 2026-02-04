/**
 * Portable Vehicle SQFT Module
 * Zero dependencies on Supabase - works standalone
 * Copy both vehicleSqft.full.json and vehicleSqft.ts to your project
 */

import vehicleData from "./vehicleSqft.full.json";

// ============================================
// TYPES
// ============================================

export interface VehicleEntry {
  make: string;
  model: string;
  yearStart: number | null;
  yearEnd: number | null;
  totalSqft: number;
  panels: {
    sides: number;
    back: number;
    hood: number;
    roof: number;
  };
}

export interface VehicleSQFTOptions {
  withRoof: number;
  withoutRoof: number;
  roofOnly: number;
  panels: {
    sides: number;
    back: number;
    hood: number;
    roof: number;
  };
}

export interface VehicleMatch {
  make: string;
  model: string;
  yearStart: number | null;
  yearEnd: number | null;
  totalSqft: number;
  panels?: {
    sides: number;
    back: number;
    hood: number;
    roof: number;
  };
  matchType: "exact" | "alias" | "fuzzy";
}

export interface ParsedQuery {
  year?: number;
  make?: string;
  model?: string;
  normalized: string;
}

// ============================================
// RAW DATA EXPORT
// ============================================

export const VEHICLE_SQFT: VehicleEntry[] = vehicleData as VehicleEntry[];

// ============================================
// ALIAS MAPPING
// ============================================

const ALIASES: Record<string, string> = {
  // Make aliases
  chevy: "chevrolet",
  benz: "mercedes",
  merc: "mercedes",
  "mercedes-benz": "mercedes",
  vw: "volkswagen",
  
  // Model aliases (applied after make normalization)
  f150: "f-150",
  "f 150": "f-150",
  f250: "f-250",
  "f 250": "f-250",
  f350: "f-350",
  "f 350": "f-350",
  "f-150": "f150",
  ram1500: "ram 1500",
  "ram 1500": "ram 1500",
  silverado1500: "silverado 1500",
  "sprinter van": "sprinter",
  "transit van": "transit",
  "promaster van": "promaster",
  "dodge ram": "ram",
};

// ============================================
// NORMALIZATION HELPERS
// ============================================

/**
 * Normalize user input for matching
 * - Trim and collapse spaces
 * - Lowercase
 * - Standardize hyphens/spaces (F 150 -> f-150)
 * - Apply aliases
 */
export function normalizeVehicleName(input: string): string {
  if (!input) return "";
  
  let normalized = input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // collapse multiple spaces
    .replace(/['']/g, "") // remove apostrophes
    .replace(/[^\w\s\-\.]/g, "") // remove non-essential punctuation
    .trim();
  
  // Apply aliases
  for (const [alias, replacement] of Object.entries(ALIASES)) {
    if (normalized === alias || normalized.includes(alias)) {
      normalized = normalized.replace(alias, replacement);
    }
  }
  
  // Standardize common truck model patterns (F150 -> F-150)
  normalized = normalized.replace(/\b([fF])(\d{3})\b/g, "$1-$2");
  
  return normalized;
}

/**
 * Parse a natural language query to extract year and vehicle text
 * e.g., "2020 Ford F150" -> { year: 2020, normalized: "ford f-150" }
 */
export function parseVehicleQuery(input: string): ParsedQuery {
  if (!input) return { normalized: "" };
  
  const normalized = normalizeVehicleName(input);
  
  // Extract 4-digit year (1980-2030 range)
  const yearMatch = input.match(/\b(19[89]\d|20[0-3]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
  
  // Remove year from normalized string
  let withoutYear = normalized;
  if (yearMatch) {
    withoutYear = normalized.replace(yearMatch[1], "").trim().replace(/\s+/g, " ");
  }
  
  // Try to split into make/model (first word is usually make)
  const parts = withoutYear.split(" ");
  const make = parts[0] || undefined;
  const model = parts.slice(1).join(" ") || undefined;
  
  return {
    year,
    make,
    model,
    normalized: withoutYear,
  };
}

// ============================================
// MATCHING FUNCTIONS
// ============================================

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  const tokensB = new Set(b.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  
  let matches = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) matches++;
    // Partial match for longer tokens
    for (const tokenB of tokensB) {
      if (token.length >= 3 && tokenB.includes(token)) matches += 0.5;
      if (tokenB.length >= 3 && token.includes(tokenB)) matches += 0.5;
    }
  }
  
  return matches / Math.max(tokensA.size, tokensB.size, 1);
}

function yearInRange(year: number | undefined, yearStart: number | null, yearEnd: number | null): boolean {
  if (!year) return true; // No year specified = match any
  if (yearStart === null || yearEnd === null) return true;
  return year >= yearStart && year <= yearEnd;
}

/**
 * Find vehicle SQFT from natural language input
 * Tries exact match, then alias match, then fuzzy match
 */
export function findVehicleSqft(input: string): VehicleMatch | null {
  if (!input || !input.trim()) return null;
  
  const parsed = parseVehicleQuery(input);
  const normalizedInput = parsed.normalized;
  
  if (!normalizedInput) return null;
  
  let bestMatch: VehicleEntry | null = null;
  let bestScore = 0;
  let matchType: "exact" | "alias" | "fuzzy" = "fuzzy";
  
  for (const vehicle of VEHICLE_SQFT) {
    const vehicleMake = normalizeVehicleName(vehicle.make);
    const vehicleModel = normalizeVehicleName(vehicle.model);
    const fullVehicle = `${vehicleMake} ${vehicleModel}`;
    
    // Check year range
    if (!yearInRange(parsed.year, vehicle.yearStart, vehicle.yearEnd)) {
      continue;
    }
    
    // Exact make + model match
    if (parsed.make && parsed.model) {
      const inputMake = normalizeVehicleName(parsed.make);
      const inputModel = normalizeVehicleName(parsed.model);
      
      if (vehicleMake === inputMake && 
          (vehicleModel.includes(inputModel) || inputModel.includes(vehicleModel))) {
        bestMatch = vehicle;
        bestScore = 1;
        matchType = "exact";
        break;
      }
    }
    
    // Full string match
    if (normalizedInput === fullVehicle || 
        fullVehicle.includes(normalizedInput) || 
        normalizedInput.includes(fullVehicle)) {
      bestMatch = vehicle;
      bestScore = 1;
      matchType = "exact";
      break;
    }
    
    // Token overlap scoring
    const score = tokenOverlap(normalizedInput, fullVehicle);
    if (score > bestScore && score >= 0.4) {
      bestMatch = vehicle;
      bestScore = score;
      matchType = score >= 0.8 ? "alias" : "fuzzy";
    }
  }
  
  if (!bestMatch) return null;
  
  return {
    make: bestMatch.make,
    model: bestMatch.model,
    yearStart: bestMatch.yearStart,
    yearEnd: bestMatch.yearEnd,
    totalSqft: bestMatch.totalSqft,
    panels: bestMatch.panels,
    matchType,
  };
}

// ============================================
// DROPDOWN HELPERS
// ============================================

/**
 * Return dropdown-ready list
 * label: "2019–2024 Ford F-150"
 * value: "ford|f-150|2019-2024"
 */
export function listVehicleOptions(): { label: string; value: string }[] {
  return VEHICLE_SQFT.map((v) => {
    const yearRange = v.yearStart && v.yearEnd 
      ? `${v.yearStart}–${v.yearEnd}` 
      : v.yearStart 
        ? `${v.yearStart}+` 
        : "All Years";
    
    const normalizedMake = v.make.toLowerCase().replace(/\s+/g, "-");
    const normalizedModel = v.model.toLowerCase().replace(/\s+/g, "-").replace(/['"]/g, "");
    const valueYears = v.yearStart && v.yearEnd 
      ? `${v.yearStart}-${v.yearEnd}` 
      : "all";
    
    return {
      label: `${yearRange} ${v.make} ${v.model}`,
      value: `${normalizedMake}|${normalizedModel}|${valueYears}`,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================
// LEGACY COMPATIBILITY EXPORTS
// Keep existing API working
// ============================================

/**
 * Get vehicle SQFT options from lookup table (legacy API)
 * Returns all three SQFT values: with roof, without roof, and roof only
 */
export function getVehicleSQFTOptions(year: string, make: string, model: string): VehicleSQFTOptions | null {
  if (!make || !model) return null;
  
  const normalizedMake = normalizeVehicleName(make);
  const normalizedModel = normalizeVehicleName(model);
  const yearNum = parseInt(year);
  
  const vehicle = VEHICLE_SQFT.find((v) => {
    const vMake = normalizeVehicleName(v.make);
    const vModel = normalizeVehicleName(v.model);
    
    const makeMatch = vMake === normalizedMake;
    const modelMatch = vModel.includes(normalizedModel) || normalizedModel.includes(vModel);
    
    let yearMatch = true;
    if (!isNaN(yearNum) && v.yearStart && v.yearEnd) {
      yearMatch = yearNum >= v.yearStart && yearNum <= v.yearEnd;
    }
    
    return makeMatch && modelMatch && yearMatch;
  });
  
  if (!vehicle) return null;
  
  const panels = vehicle.panels;
  const withoutRoof = panels.sides + panels.back + panels.hood;
  
  return {
    withRoof: vehicle.totalSqft,
    withoutRoof: Math.round(withoutRoof * 10) / 10,
    roofOnly: panels.roof,
    panels: {
      sides: panels.sides,
      back: panels.back,
      hood: panels.hood,
      roof: panels.roof,
    },
  };
}

/**
 * Get all unique makes from vehicle database
 */
export function getVehicleMakes(): string[] {
  const makes = new Set(VEHICLE_SQFT.map((v) => v.make));
  return Array.from(makes).sort();
}

/**
 * Get models for a specific make
 */
export function getVehicleModels(make: string): string[] {
  if (!make) return [];
  
  const normalizedMake = normalizeVehicleName(make);
  const models = VEHICLE_SQFT
    .filter((v) => normalizeVehicleName(v.make) === normalizedMake)
    .map((v) => v.model);
  
  return Array.from(new Set(models)).sort();
}

/**
 * Get available years for a specific make and model
 * Expands year ranges into individual years
 */
export function getVehicleYears(make: string, model: string): string[] {
  if (!make || !model) return [];
  
  const normalizedMake = normalizeVehicleName(make);
  const normalizedModel = normalizeVehicleName(model);
  
  const matchingVehicles = VEHICLE_SQFT.filter((v) => {
    const vMake = normalizeVehicleName(v.make);
    const vModel = normalizeVehicleName(v.model);
    return vMake === normalizedMake && vModel === normalizedModel;
  });
  
  const years: number[] = [];
  
  for (const vehicle of matchingVehicles) {
    if (vehicle.yearStart && vehicle.yearEnd) {
      for (let y = vehicle.yearStart; y <= vehicle.yearEnd; y++) {
        years.push(y);
      }
    }
  }
  
  // Deduplicate and sort descending (newest first)
  return [...new Set(years)].sort((a, b) => b - a).map(String);
}

/**
 * @deprecated Use getVehicleSQFTOptions instead
 */
export function getVehicleSQFT(year: string, make: string, model: string): number | null {
  const options = getVehicleSQFTOptions(year, make, model);
  return options?.withRoof ?? null;
}
