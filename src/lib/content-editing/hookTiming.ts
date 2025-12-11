// 7s / 15s / 30s hook length checker (offline)

export interface HookTiming {
  seconds: number;
  words: number;
  ok7: boolean;
  ok15: boolean;
  ok30: boolean;
  recommendation: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

// Average speaking rate: ~2.5 words per second
const WORDS_PER_SECOND = 2.5;

export function hookTiming(text: string): HookTiming {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round(words / WORDS_PER_SECOND);
  
  const ok7 = seconds <= 7;
  const ok15 = seconds <= 15;
  const ok30 = seconds <= 30;
  
  let recommendation = '';
  let color: HookTiming['color'] = 'green';
  
  if (seconds <= 7) {
    recommendation = 'Perfect for story ads';
    color = 'green';
  } else if (seconds <= 15) {
    recommendation = 'Good for short reels';
    color = 'yellow';
  } else if (seconds <= 30) {
    recommendation = 'Standard reel length';
    color = 'orange';
  } else {
    recommendation = 'Consider shortening';
    color = 'red';
  }
  
  return {
    seconds,
    words,
    ok7,
    ok15,
    ok30,
    recommendation,
    color,
  };
}

export function formatTimingBadge(timing: HookTiming): string {
  const badges: string[] = [];
  if (timing.ok7) badges.push('7s');
  if (timing.ok15) badges.push('15s');
  if (timing.ok30) badges.push('30s');
  return `~${timing.seconds}s${badges.length > 0 ? ' • ' + badges.join(' • ') : ''}`;
}
