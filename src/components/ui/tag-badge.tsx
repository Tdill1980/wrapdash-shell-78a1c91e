import React from "react";
import { cn } from "@/lib/utils";
import { TAG_LABELS } from "@/lib/style-tag-rules";

interface TagBadgeProps {
  tag: string;
  variant?: "default" | "style" | "visual" | "quality" | "match";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const VARIANT_STYLES = {
  default: "bg-muted text-muted-foreground border-border",
  style: "bg-primary/10 text-primary border-primary/20",
  visual: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  quality: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  match: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

const STYLE_TAGS = ["ugly_ads", "lo_fi", "raw", "behind_the_scenes", "grid_style", "clean", "polished", "testimonial", "negative_marketing", "before_after", "b_roll", "product_focus", "hero_shot"];
const QUALITY_TAGS = ["professional", "amateur", "unpolished", "imperfect", "high_resolution", "low_resolution"];

function getAutoVariant(tag: string): TagBadgeProps["variant"] {
  if (STYLE_TAGS.includes(tag)) return "style";
  if (QUALITY_TAGS.includes(tag)) return "quality";
  return "visual";
}

export function TagBadge({ 
  tag, 
  variant, 
  size = "sm", 
  showLabel = true,
  className 
}: TagBadgeProps) {
  const autoVariant = variant || getAutoVariant(tag);
  const label = showLabel ? (TAG_LABELS[tag] || tag.replace(/_/g, ' ')) : tag;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        VARIANT_STYLES[autoVariant],
        className
      )}
    >
      {label}
    </span>
  );
}

interface TagListProps {
  tags: string[] | null | undefined;
  maxVisible?: number;
  size?: "sm" | "md";
  className?: string;
}

export function TagList({ tags, maxVisible = 4, size = "sm", className }: TagListProps) {
  if (!tags?.length) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleTags.map((tag) => (
        <TagBadge key={tag} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className={cn(
          "inline-flex items-center text-muted-foreground",
          size === "sm" ? "text-[9px]" : "text-[10px]"
        )}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

interface StyleMatchBadgeProps {
  clipTags: string[] | null | undefined;
  styleTags: string[];
  className?: string;
}

export function StyleMatchBadge({ clipTags, styleTags, className }: StyleMatchBadgeProps) {
  if (!clipTags?.length || !styleTags.length) return null;

  const matchingTags = clipTags.filter(t => styleTags.includes(t));
  if (!matchingTags.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {matchingTags.slice(0, 3).map((tag) => (
        <TagBadge key={tag} tag={tag} variant="match" size="sm" />
      ))}
    </div>
  );
}
