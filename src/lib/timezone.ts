import { formatInTimeZone } from "date-fns-tz";

// Arizona timezone (no DST)
export const ARIZONA_TZ = "America/Phoenix";

export function formatTimeAZ(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = formatInTimeZone(date, ARIZONA_TZ, "yyyy-MM-dd") === formatInTimeZone(now, ARIZONA_TZ, "yyyy-MM-dd");
    
    if (isToday) {
      return formatInTimeZone(date, ARIZONA_TZ, "h:mm a");
    }
    return formatInTimeZone(date, ARIZONA_TZ, "MMM d, h:mm a");
  } catch {
    return "";
  }
}

export function formatDateAZ(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return formatInTimeZone(new Date(dateStr), ARIZONA_TZ, "MMM d, yyyy");
  } catch {
    return "N/A";
  }
}

export function formatRelativeAZ(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatInTimeZone(date, ARIZONA_TZ, "MMM d");
  } catch {
    return "";
  }
}
