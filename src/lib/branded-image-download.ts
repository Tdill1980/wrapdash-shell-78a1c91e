// ============================================
// Branded Image Download Utility
// ============================================
// Bakes branding into downloaded images so they always have
// "WrapCommandAI™ for [Tenant]" + "ApproveFlow™" when shared.

import { toast } from "sonner";

interface BrandingConfig {
  line1: string; // e.g., "WrapCommandAI™ for WPW"
  line2: string; // e.g., "ApproveFlow™"
}

const DEFAULT_BRANDING: BrandingConfig = {
  line1: "WrapCommandAI™ for WPW",
  line2: "ApproveFlow™",
};

/**
 * Downloads an image with branding baked in.
 * Top-left: Platform branding (2 lines)
 * Bottom-right: Order number
 */
export async function downloadBrandedImage(
  imageUrl: string,
  orderNumber: string,
  viewLabel: string,
  branding: BrandingConfig = DEFAULT_BRANDING
): Promise<void> {
  try {
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    
    // Create canvas with image dimensions
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");
    
    // Draw original image
    ctx.drawImage(imageBitmap, 0, 0);
    
    // Calculate font sizes based on image dimensions
    const baseFontSize = Math.max(16, Math.min(32, imageBitmap.width / 50));
    const smallFontSize = baseFontSize * 0.75;
    const padding = baseFontSize * 1.5;
    
    // ============================================
    // TOP-LEFT BRANDING
    // ============================================
    
    // Background box for branding
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const brandingBoxWidth = baseFontSize * 14;
    const brandingBoxHeight = baseFontSize * 3;
    ctx.fillRect(padding, padding, brandingBoxWidth, brandingBoxHeight);
    
    // Line 1: Platform name (e.g., "WrapCommandAI™ for WPW")
    ctx.fillStyle = "#000000";
    ctx.font = `600 ${baseFontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(branding.line1, padding + 12, padding + baseFontSize + 4);
    
    // Line 2: Tool name (e.g., "ApproveFlow™")
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.font = `400 ${smallFontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(branding.line2, padding + 12, padding + baseFontSize + smallFontSize + 8);
    
    // ============================================
    // BOTTOM-RIGHT ORDER NUMBER
    // ============================================
    
    const orderText = `Order #${orderNumber}`;
    ctx.font = `500 ${baseFontSize}px Inter, system-ui, sans-serif`;
    const orderTextWidth = ctx.measureText(orderText).width;
    
    // Background box for order number
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const orderBoxWidth = orderTextWidth + 24;
    const orderBoxHeight = baseFontSize + 16;
    const orderBoxX = imageBitmap.width - padding - orderBoxWidth;
    const orderBoxY = imageBitmap.height - padding - orderBoxHeight;
    ctx.fillRect(orderBoxX, orderBoxY, orderBoxWidth, orderBoxHeight);
    
    // Order number text
    ctx.fillStyle = "#000000";
    ctx.fillText(orderText, orderBoxX + 12, orderBoxY + baseFontSize + 4);
    
    // ============================================
    // EXPORT AND DOWNLOAD
    // ============================================
    
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to generate image");
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${viewLabel.replace(/\s+/g, "_")}_Order_${orderNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${viewLabel}`);
    }, "image/png", 0.95);
    
  } catch (error) {
    console.error("Branded download error:", error);
    toast.error("Failed to download image");
  }
}

/**
 * Get branding configuration based on organization settings.
 * For now, returns default WPW branding.
 * In the future, this will check subscription tier for co-branding.
 */
export function getBrandingConfig(
  organizationName?: string | null,
  subscriptionTier?: string | null
): BrandingConfig {
  // Future: Enterprise tier gets co-branding
  if (subscriptionTier === "enterprise" && organizationName) {
    return {
      line1: `WrapCommandAI™ for ${organizationName}`,
      line2: "ApproveFlow™",
    };
  }
  
  // Default: WPW co-branding (current tenant)
  return DEFAULT_BRANDING;
}
