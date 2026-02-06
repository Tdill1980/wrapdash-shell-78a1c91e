// =============================================================================
// ⚠️ WPW EDGE FUNCTIONS HELPER - USES YOUR SUPABASE, NOT LOVABLE ⚠️
// =============================================================================
// Despite the filename, this file uses YOUR Supabase (qxllysilzonrlyoaomce)
// Lovable (wzwqhfbmymrengjqikjl) is ONLY for 3D renders - see lovable3DRenders in client.ts
// =============================================================================

const WPW_FUNCTIONS_URL = 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1';

interface InvokeOptions {
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

interface InvokeResult<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * Invoke a WPW edge function
 * All edge functions run on YOUR Supabase (qxllysilzonrlyoaomce)
 */
export async function invokeLovableFunction<T = any>(
  functionName: string,
  options: InvokeOptions = {}
): Promise<InvokeResult<T>> {
  try {
    const response = await fetch(`${WPW_FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
 * Get the WPW functions base URL
 */
export function getLovableFunctionsUrl(): string {
  return WPW_FUNCTIONS_URL;
}
