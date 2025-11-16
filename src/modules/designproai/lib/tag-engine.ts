import { generateTags, normalizeTags, mergeTags } from "@/lib/tag-engine";

interface GenerateVisualizationTagsParams {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  vehicleType: string;
  colorHex: string;
  colorName?: string;
  finishType: string;
  mode: "inkfusion" | "material" | "approval";
  hasCustomDesign: boolean;
}

export const generateVisualizationTags = (params: GenerateVisualizationTagsParams): string[] => {
  const {
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleType,
    colorHex,
    colorName,
    finishType,
    mode,
    hasCustomDesign,
  } = params;

  const baseTags = [
    vehicleMake.toLowerCase(),
    vehicleModel.toLowerCase().replace(/\s+/g, "-"),
    vehicleType.toLowerCase(),
    finishType.toLowerCase(),
    mode,
  ];

  if (vehicleYear) {
    baseTags.push(vehicleYear.toString());
  }

  if (colorName) {
    baseTags.push(...colorName.toLowerCase().split(" "));
  }

  // Add color-related tags
  const colorCategory = getColorCategory(colorHex);
  if (colorCategory) {
    baseTags.push(colorCategory);
  }

  if (hasCustomDesign) {
    baseTags.push("custom-design", "printed-wrap");
  }

  // Add mode-specific tags
  if (mode === "inkfusion") {
    baseTags.push("catalog-color", "infusion-mode");
  } else if (mode === "material") {
    baseTags.push("material-mode", "custom-swatch");
  } else if (mode === "approval") {
    baseTags.push("approval-mode", "design-preview");
  }

  // Deduplicate and normalize
  return Array.from(new Set(baseTags.map(tag => tag.toLowerCase().trim())));
};

const getColorCategory = (hex: string): string | null => {
  // Simple color categorization based on hex value
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Grayscale
  if (diff < 30) {
    if (max < 50) return "black";
    if (max > 220) return "white";
    return "gray";
  }

  // Color categories
  if (r > g && r > b) {
    if (g > b + 30) return "orange";
    if (r > 200 && g < 100 && b < 100) return "red";
    return "red";
  }

  if (g > r && g > b) {
    if (r > b + 30) return "yellow";
    return "green";
  }

  if (b > r && b > g) {
    if (r > g + 30) return "purple";
    return "blue";
  }

  return null;
};
