// Template OS - Main Export
// Complete Ad Template System for WPW + RestylePro

// Grid Templates (9 Total)
export * from "./grid-templates";

// Static Templates (12 Total)
export * from "./static-templates";

// Reel/Video Templates (10 Total)
export * from "./reel-templates";

// Brand Design System
export * from "./brand-system";

// AI Messaging Engine
export * from "./messaging-engine";

// ═══════════════════════════════════════════════════════════════
// TEMPLATE OS OVERVIEW
// ═══════════════════════════════════════════════════════════════
//
// This is the complete Template Operating System for WPW + RestylePro
// ad generation. It includes:
//
// 01_GRID_TEMPLATES/ (9 Templates)
//    - WPW: Premium Moodboard, Before/After, US vs Them, Show Car, Commercial
//    - RestylePro: Visualizer, PatternPro, DesignPanelPro, Ecosystem
//
// 02_STATIC_TEMPLATES/ (12 Templates)
//    - Comparison: Before/After Static, Before/After Swipe, US vs Them, Problem/Solution
//    - Showcase: Premium Craft, Feature Benefits, Show Car Winner, Commercial Fleet
//    - Social Proof: Installer Quote
//    - App Demo: RestylePro Demo, Suite Overview
//    - Promo: CTA Sale
//
// 03_REEL_TEMPLATES/ (10 Templates)
//    - WPW: Moodboard Reel, Installer POV, Grid Reveal, Commercial Fleet, Show Car Winner
//    - RestylePro: App Demo, PatternPro Animation
//    - Both: Before/After Reveal, Problem/Solution, Promo Swipe Up
//
// 04_BRAND_SYSTEM/
//    - WPW Brand: Colors, Typography, Spacing, Crop Rules
//    - RestylePro Brand: Colors, Typography, Spacing, Crop Rules
//    - Global Design Rules: Text Placement, Grid Rules, CTA Rules, Export Sizes
//
// 05_MESSAGING_ENGINE/
//    - Pain Points: Installer, Commercial, App User
//    - Value Props: WPW, RestylePro
//    - Conversion Hooks: 20+ hooks by brand and category
//    - CTA Variations: 20+ CTAs by brand and style
//    - Search Bar Text: For all grid templates
//    - Headline Library: By category and brand
//
// ═══════════════════════════════════════════════════════════════

import { GRID_TEMPLATES, GridTemplate } from "./grid-templates";
import { STATIC_TEMPLATES, StaticTemplate } from "./static-templates";
import { REEL_TEMPLATES, ReelTemplate } from "./reel-templates";
import { BRAND_SYSTEMS, BrandSystem, GLOBAL_DESIGN_RULES } from "./brand-system";
import { PAIN_POINTS, VALUE_PROPS, CONVERSION_HOOKS, CTA_VARIATIONS, SEARCH_BAR_TEXT, HEADLINE_LIBRARY } from "./messaging-engine";

// Unified template selector
export interface TemplateOSQuery {
  brand?: "wpw" | "restylepro" | "both";
  type?: "grid" | "static" | "reel";
  category?: string;
}

export const queryTemplates = (query: TemplateOSQuery) => {
  const results: {
    grids: GridTemplate[];
    statics: StaticTemplate[];
    reels: ReelTemplate[];
  } = {
    grids: [],
    statics: [],
    reels: [],
  };

  const brand = query.brand || "both";

  if (!query.type || query.type === "grid") {
    results.grids = Object.values(GRID_TEMPLATES).filter(
      (t) => t.brand === brand || t.brand === "both" || brand === "both"
    );
  }

  if (!query.type || query.type === "static") {
    results.statics = Object.values(STATIC_TEMPLATES).filter(
      (t) => t.brand === brand || t.brand === "both" || brand === "both"
    );
  }

  if (!query.type || query.type === "reel") {
    results.reels = Object.values(REEL_TEMPLATES).filter(
      (t) => t.brand === brand || t.brand === "both" || brand === "both"
    );
  }

  return results;
};

// Template counts
export const TEMPLATE_COUNTS = {
  grid: Object.keys(GRID_TEMPLATES).length,
  static: Object.keys(STATIC_TEMPLATES).length,
  reel: Object.keys(REEL_TEMPLATES).length,
  total: Object.keys(GRID_TEMPLATES).length + Object.keys(STATIC_TEMPLATES).length + Object.keys(REEL_TEMPLATES).length,
  hooks: CONVERSION_HOOKS.length,
  ctas: CTA_VARIATIONS.length,
};

// Quick stats
export const getTemplateOSStats = () => ({
  gridTemplates: TEMPLATE_COUNTS.grid,
  staticTemplates: TEMPLATE_COUNTS.static,
  reelTemplates: TEMPLATE_COUNTS.reel,
  totalTemplates: TEMPLATE_COUNTS.total,
  brands: Object.keys(BRAND_SYSTEMS).length,
  conversionHooks: TEMPLATE_COUNTS.hooks,
  ctaVariations: TEMPLATE_COUNTS.ctas,
  painPointCategories: Object.keys(PAIN_POINTS).length,
  valuePropCategories: Object.keys(VALUE_PROPS).length,
  headlineCategories: Object.keys(HEADLINE_LIBRARY).length,
});
