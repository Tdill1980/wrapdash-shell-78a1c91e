/**
 * Lovable Edge Functions Helper
 * All edge function calls go through Lovable's Supabase
 * Database calls still use our Supabase (qxllysilzonrlyoaomce)
 */

const LOVABLE_FUNCTIONS_URL = import.meta.env.VITE_LOVABLE_FUNCTIONS_URL || 'https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1';
const LOVABLE_ANON_KEY = import.meta.env.VITE_LOVABLE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3FoZmJteW1yZW5nanFpa2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM3OTgsImV4cCI6MjA3ODgxOTc5OH0.-LtBxqJ7gNmImakDRGQyr1e7FXrJCQQXF5zE5Fre_1I';

interface InvokeOptions {
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

interface InvokeResult<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * Invoke a Lovable edge function
 * Drop-in replacement for lovableFunctions.functions.invoke()
 */
export async function invokeLovableFunction<T = any>(
  functionName: string,
  options: InvokeOptions = {}
): Promise<InvokeResult<T>> {
  try {
    const response = await fetch(`${LOVABLE_FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_ANON_KEY}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: new Error(data?.error || data?.message || `Function ${functionName} failed with status ${response.status}`),
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Get the Lovable functions base URL
 */
export function getLovableFunctionsUrl(): string {
  return LOVABLE_FUNCTIONS_URL;
}

/**
 * Get the Lovable anon key for auth headers
 */
export function getLovableAnonKey(): string {
  return LOVABLE_ANON_KEY;
}
