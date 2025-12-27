/**
 * Removes undefined values from objects before JSON storage
 * Critical for Supabase JSONB columns which silently drop undefined
 */
export function sanitizeForJson<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
