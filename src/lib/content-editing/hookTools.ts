// Offline hook transformation tools - no AI dependency

export function makeHookStronger(text: string): string {
  return `Most people don't realize this:\n${text}`;
}

export function shortenScript(text: string): string {
  return text.split("\n").filter(Boolean).slice(0, 3).join("\n");
}

export function makeDirect(text: string): string {
  return text.replace(/I think|maybe|kind of|probably|might|could be/gi, "").replace(/\s+/g, " ").trim();
}

export function founderTone(text: string): string {
  return `I built this because I was tired of seeing this happen.\n${text}`;
}

export function installerTone(text: string): string {
  return `If you install wraps, you already know this.\n${text}`;
}

export function proofTone(text: string): string {
  return `This is real footage from a real shop.\n${text}`;
}

export type HookTool = {
  id: string;
  label: string;
  description: string;
  transform: (text: string) => string;
};

export const HOOK_TOOLS: HookTool[] = [
  { id: 'stronger', label: 'Stronger Hook', description: 'Add attention-grabbing opener', transform: makeHookStronger },
  { id: 'shorten', label: 'Shorten', description: 'Keep first 3 lines', transform: shortenScript },
  { id: 'direct', label: 'More Direct', description: 'Remove weak language', transform: makeDirect },
  { id: 'founder', label: 'Founder Voice', description: 'Add founder credibility', transform: founderTone },
  { id: 'installer', label: 'Installer Voice', description: 'Add installer relatability', transform: installerTone },
];
