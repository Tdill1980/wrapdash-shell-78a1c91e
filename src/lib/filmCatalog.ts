// ColorPro OS - Film Catalog Data Layer
// Reads ONLY from the official film_catalog table

import { supabase } from "@/integrations/supabase/client";
import type { FilmCatalogRow, ManufacturerKey } from "@/types/colorpro-os";

/**
 * Fetch films from the official catalog
 * @param manufacturer - Filter by manufacturer (3m or avery)
 * @param series - Optional filter by series (2080, sw900, etc.)
 */
export async function fetchFilmCatalog(
  manufacturer: ManufacturerKey,
  series?: string
): Promise<FilmCatalogRow[]> {
  // Use raw SQL query since table may not be in generated types yet
  let sql = `
    SELECT id, manufacturer, series, official_code, official_name, finish, swatch_image_url, swatch_hex, needs_review
    FROM film_catalog
    WHERE manufacturer = $1 AND is_active = true
  `;
  const params: unknown[] = [manufacturer];
  
  if (series) {
    sql += ` AND series = $2`;
    params.push(series);
  }
  
  sql += ` ORDER BY official_code ASC`;

  const { data, error } = await supabase.rpc('exec_sql' as never, { query: sql, params } as never)
    .then(() => {
      // Fallback to direct table query with type bypass
      let query = (supabase as any).from('film_catalog')
        .select('id, manufacturer, series, official_code, official_name, finish, swatch_image_url, swatch_hex, needs_review')
        .eq('manufacturer', manufacturer)
        .eq('is_active', true)
        .order('official_code', { ascending: true });
      
      if (series) {
        query = query.eq('series', series);
      }
      
      return query;
    });

  // Direct query approach (simpler)
  let query = (supabase as any).from('film_catalog')
    .select('id, manufacturer, series, official_code, official_name, finish, swatch_image_url, swatch_hex, needs_review')
    .eq('manufacturer', manufacturer)
    .eq('is_active', true)
    .order('official_code', { ascending: true });
  
  if (series) {
    query = query.eq('series', series);
  }

  const result = await query;

  if (result.error) {
    console.error("[FilmCatalog] Error fetching catalog:", result.error);
    throw result.error;
  }

  return (result.data ?? []) as FilmCatalogRow[];
}

/**
 * Fetch a single film by its canonical identifiers
 * Returns null if not found (used for OS guard)
 */
export async function fetchFilmByCode(
  manufacturer: ManufacturerKey,
  series: string,
  official_code: string
): Promise<FilmCatalogRow | null> {
  const { data, error } = await (supabase as any)
    .from('film_catalog')
    .select('id, manufacturer, series, official_code, official_name, finish, swatch_image_url, swatch_hex, needs_review')
    .eq('manufacturer', manufacturer)
    .eq('series', series)
    .eq('official_code', official_code)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error("[FilmCatalog] Error fetching film:", error);
    throw error;
  }

  return data as FilmCatalogRow | null;
}

/**
 * Search films by name (for typeahead/search UIs)
 */
export async function searchFilmCatalog(
  searchTerm: string,
  manufacturer?: ManufacturerKey
): Promise<FilmCatalogRow[]> {
  let query = (supabase as any)
    .from('film_catalog')
    .select('id, manufacturer, series, official_code, official_name, finish, swatch_image_url, swatch_hex, needs_review')
    .eq('is_active', true)
    .ilike('official_name', `%${searchTerm}%`)
    .order('official_name', { ascending: true })
    .limit(50);

  if (manufacturer) {
    query = query.eq('manufacturer', manufacturer);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[FilmCatalog] Error searching catalog:", error);
    throw error;
  }

  return (data ?? []) as FilmCatalogRow[];
}

/**
 * Get all unique series for a manufacturer
 */
export async function fetchFilmSeries(manufacturer: ManufacturerKey): Promise<string[]> {
  const { data, error } = await (supabase as any)
    .from('film_catalog')
    .select('series')
    .eq('manufacturer', manufacturer)
    .eq('is_active', true);

  if (error) {
    console.error("[FilmCatalog] Error fetching series:", error);
    throw error;
  }

  // Extract unique series
  const series = new Set<string>();
  for (const row of data ?? []) {
    if (row.series) {
      series.add(row.series as string);
    }
  }

  return Array.from(series).sort();
}
