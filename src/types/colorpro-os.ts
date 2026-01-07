// ColorPro OS - Canonical Types
// Single source of truth for film catalog and ColorPro operations

export type ManufacturerKey = '3m' | 'avery';

export type FilmFinish = 'gloss' | 'matte' | 'satin' | 'metallic' | 'chrome' | 'brushed' | 'textured';

export interface FilmCatalogRow {
  id: string;
  manufacturer: ManufacturerKey;
  series: string;
  official_code: string;
  official_name: string;
  finish: FilmFinish | null;
  swatch_image_url: string | null;
  swatch_hex: string | null;
  needs_review: boolean;
}

export interface FilmSelection {
  manufacturer: ManufacturerKey;
  series: string;
  official_code: string;
  official_name: string;
}

export interface ColorProRenderRequest {
  toolKey: 'colorpro';
  vehicle: {
    year?: number;
    make: string;
    model: string;
    type: string;
    trim?: string;
  };
  film: {
    manufacturer: ManufacturerKey;
    series: string;
    official_code: string;
  };
  angle?: 'hero' | 'side' | 'rear' | 'detail';
}

export interface ColorProRenderResponse {
  ok: boolean;
  film: {
    manufacturer: ManufacturerKey;
    series: string;
    official_code: string;
    official_name: string;
    finish: string | null;
  };
  filmLabel: string;
  imageUrl?: string;
  angle?: string;
  error?: string;
}

// OS Invariant: tool key must be "colorpro" for ColorPro operations
export function assertColorProToolKey(toolKey: unknown): asserts toolKey is 'colorpro' {
  if (toolKey !== 'colorpro') {
    throw new Error(`OS violation: expected toolKey="colorpro" but got "${String(toolKey)}"`);
  }
}

// OS Invariant: validate film selection has required fields
export function assertValidFilmSelection(film: unknown): asserts film is FilmSelection {
  if (!film || typeof film !== 'object') {
    throw new Error('OS violation: film selection is required');
  }
  const f = film as Record<string, unknown>;
  if (!f.manufacturer || !f.series || !f.official_code) {
    throw new Error('OS violation: film selection must include manufacturer, series, and official_code');
  }
}
