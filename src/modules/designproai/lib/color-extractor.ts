// ⚠️ LOVABLE CONNECTION - FOR 3D RENDERS ONLY - DO NOT USE FOR DATA
// This file legitimately uses Lovable's Supabase for vinyl swatch analysis (3D render pipeline)

/**
 * Color extraction utilities for analyzing uploaded vinyl swatches
 */

export interface ExtractedColor {
  colorHex: string;
  colorName: string;
  finishType: "gloss" | "matte" | "satin";
  hasMetallicFlakes: boolean;
}

export const analyzeSwatchImage = async (imageUrl: string): Promise<ExtractedColor> => {
  // This will be called via the edge function
  throw new Error("Use analyzeSwatchViaAPI instead");
};

export const analyzeSwatchViaAPI = async (imageUrl: string): Promise<ExtractedColor> => {
  const lovableFunctionsUrl = import.meta.env.VITE_LOVABLE_FUNCTIONS_URL || 'https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1';
  const lovableAnonKey = import.meta.env.VITE_LOVABLE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3FoZmJteW1yZW5nanFpa2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM3OTgsImV4cCI6MjA3ODgxOTc5OH0.-LtBxqJ7gNmImakDRGQyr1e7FXrJCQQXF5zE5Fre_1I';

  const response = await fetch(
    `${lovableFunctionsUrl}/analyze-vinyl-swatch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableAnonKey}`,
      },
      body: JSON.stringify({ imageUrl }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze swatch");
  }

  return response.json();
};
