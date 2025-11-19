// WPW Allowed Product IDs - WooCommerce IDs that can be added to cart
export const WPW_ALLOWED_PRODUCT_IDS = [
  58391, // Custom Fade Wrap Printing (Avery)
  19420, // 3M IJ180 Contour-Cut Wrap Film (Install-Ready)
  72,    // 3M IJ180 Printed Wrap Film
  108,   // Avery Contour-Cut Wrap Film (Install-Ready)
  79,    // Printed Wrap Film w/ UV Lamination (Avery)
  234,   // Custom Vehicle Wrap Design
  58160, // Custom Vehicle Wrap Design (Copy/Draft)
  15192, // Pantone Color Chart 30×52
  80,    // Perforated Window Vinyl 50/50
  475,   // Camo & Carbon Sample Book
  39628, // Marble & Metals Swatch Book
  4179,  // Wicked & Wild Swatch Book
  42809, // Wrap By The Yard — Bape Camo
  1726,  // Wrap By The Yard — Camo & Carbon
  39698, // Wrap By The Yard — Metal & Marble
  52489, // Wrap By The Yard — Modern & Trippy
  69439, // InkFusion (main product)
];

export function isWPW(wooProductId: number | null | undefined): boolean {
  if (!wooProductId) return false;
  return WPW_ALLOWED_PRODUCT_IDS.includes(wooProductId);
}
