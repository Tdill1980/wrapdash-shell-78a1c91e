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
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-vinyl-swatch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
