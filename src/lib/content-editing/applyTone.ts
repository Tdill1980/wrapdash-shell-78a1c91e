// Founder / Installer / Proof tone modifiers (offline)

export type ToneType = 'founder' | 'installer' | 'proof' | 'none';

const TONE_PREFIXES: Record<ToneType, string> = {
  founder: "I built this because I watched this happen.\n",
  installer: "If you install wraps, you already know this.\n",
  proof: "This is real footage from a real shop.\n",
  none: "",
};

export function applyTone(text: string, tone: ToneType): string {
  if (tone === 'none') return text;
  
  const prefix = TONE_PREFIXES[tone];
  
  // Don't add prefix if text already starts with a similar opener
  const lowerText = text.toLowerCase();
  if (
    lowerText.startsWith("i built") ||
    lowerText.startsWith("if you install") ||
    lowerText.startsWith("this is real")
  ) {
    return text;
  }
  
  return prefix + text;
}

export function removeTonePrefix(text: string): string {
  // Remove common tone prefixes to get clean base text
  const prefixPatterns = [
    /^I built this because.*?\n/i,
    /^If you install wraps.*?\n/i,
    /^This is real footage.*?\n/i,
    /^Most people don't realize this:\n/i,
  ];
  
  let result = text;
  for (const pattern of prefixPatterns) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

export const TONE_OPTIONS: { id: ToneType; label: string; description: string }[] = [
  { id: 'installer', label: 'Installer', description: 'Trade credibility' },
  { id: 'founder', label: 'Founder', description: 'Builder energy' },
  { id: 'proof', label: 'Proof', description: 'Real footage focus' },
  { id: 'none', label: 'None', description: 'No prefix' },
];
