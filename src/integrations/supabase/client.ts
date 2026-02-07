// =============================================================================
// ⚠️ SUPABASE CLIENT CONFIGURATION - READ BEFORE MODIFYING ⚠️
// =============================================================================
//
// ARCHITECTURE:
// - supabase: Database client → YOUR Supabase (qxllysilzonrlyoaomce)
// - lovableFunctions: Edge functions → YOUR Supabase (qxllysilzonrlyoaomce)
// - lovable3DRenders: Lovable Supabase (wzwqhfbmymrengjqikjl)
// - contentDB: Alias for lovable3DRenders - use for content_files queries
//
// ⚠️ CONTENT DATA LIVES IN LOVABLE SUPABASE (legacy data location)
// Tables in Lovable: content_files, content_projects, content_calendar, etc.
// Use contentDB (or lovable3DRenders) for all content/media library operations!
//
// ⚠️ DO NOT change lovableFunctions to point to Lovable's Supabase
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// =============================================================================
// YOUR SUPABASE - WePrintWraps Production (qxllysilzonrlyoaomce)
// =============================================================================
const WPW_SUPABASE_URL = 'https://qxllysilzonrlyoaomce.supabase.co';
const WPW_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGx5c2lsem9ucmx5b2FvbWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzQxMjIsImV4cCI6MjA4MzgxMDEyMn0.s1IyOY7QAVyrTtG_XLhugJUvxi2X_nHCvqvchYCvwtM';

// Edge functions URL for YOUR Supabase
export const WPW_FUNCTIONS_URL = `${WPW_SUPABASE_URL}/functions/v1`;

// =============================================================================
// LOVABLE SUPABASE - ONLY FOR 3D RENDERS (wzwqhfbmymrengjqikjl)
// =============================================================================
// ⚠️ LOVABLE CONNECTION - FOR 3D RENDERS ONLY - DO NOT USE FOR DATA
const LOVABLE_SUPABASE_URL = 'https://wzwqhfbmymrengjqikjl.supabase.co';
const LOVABLE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3FoZmJteW1yZW5nanFpa2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM3OTgsImV4cCI6MjA3ODgxOTc5OH0.-LtBxqJ7gNmImakDRGQyr1e7FXrJCQQXF5zE5Fre_1I';
export const LOVABLE_FUNCTIONS_API_URL = `${LOVABLE_SUPABASE_URL}/functions/v1`;
export const LOVABLE_AUTH_KEY = LOVABLE_ANON_KEY;

// =============================================================================
// MAIN CLIENTS
// =============================================================================

// Database client - YOUR Supabase
export const supabase = createClient<Database>(WPW_SUPABASE_URL, WPW_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Edge functions client - YOUR Supabase (used by 90% of the app)
// This was incorrectly pointing to Lovable before - NOW FIXED
export const lovableFunctions = createClient(WPW_SUPABASE_URL, WPW_ANON_KEY);

// =============================================================================
// LOVABLE CLIENT - 3D RENDERS + CONTENT DATA
// =============================================================================
// Used for:
// - DesignPanelPro color renders
// - ApproveFlow 3D studio renders
// - generate-color-render, generate-studio-renders, generate-3d, generate-3dproof
// - content_files, content_projects, content_calendar, etc. (legacy data location)
// - Media Library uploads/queries
export const lovable3DRenders = createClient(LOVABLE_SUPABASE_URL, LOVABLE_ANON_KEY);

// =============================================================================
// CONTENT DATABASE CLIENT (alias for clarity)
// =============================================================================
// Use this for content_files, content_projects, content_calendar, media-library storage
// This is where all the content/video data actually lives!
export const contentDB = lovable3DRenders;

// =============================================================================
// HELPER FUNCTION - Call edge functions on YOUR Supabase
// =============================================================================
export async function callEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any> = {},
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  const url = `${WPW_FUNCTIONS_URL}/${functionName}`;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Edge function ${functionName} failed: ${response.status} - ${text}`);
  }

  return response.json();
}
