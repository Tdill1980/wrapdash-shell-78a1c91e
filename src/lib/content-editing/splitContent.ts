// Script → Caption → Headline auto-split (offline)

export interface ContentSplit {
  headline: string;
  caption: string;
  script: string;
}

export function splitContent(text: string): ContentSplit {
  const lines = text.split("\n").filter(Boolean);
  return {
    headline: lines[0] ?? "",
    caption: lines.slice(0, 3).join(" "),
    script: text,
  };
}

export function extractHeadline(text: string): string {
  const lines = text.split("\n").filter(Boolean);
  return lines[0] ?? "";
}

export function extractCaption(text: string, maxLines: number = 3): string {
  const lines = text.split("\n").filter(Boolean);
  return lines.slice(0, maxLines).join(" ");
}
