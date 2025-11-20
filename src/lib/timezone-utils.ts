import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Converts a UTC timestamp to the user's local timezone and formats it
 * @param utcTimestamp - ISO string or Date object in UTC
 * @param formatStr - date-fns format string (default: "MMM d, yyyy 'at' h:mm a")
 * @returns Formatted date string in local timezone
 */
export function formatInLocalTimezone(
  utcTimestamp: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy 'at' h:mm a"
): string {
  if (!utcTimestamp) return "N/A";
  
  try {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Convert UTC to user's timezone
    const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
    const zonedDate = toZonedTime(date, userTimezone);
    
    // Format the date
    return format(zonedDate, formatStr);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return "Invalid date";
  }
}

/**
 * Formats a timestamp as a short date (e.g., "Nov 20, 2025")
 */
export function formatShortDate(utcTimestamp: string | Date | null | undefined): string {
  return formatInLocalTimezone(utcTimestamp, "MMM d, yyyy");
}

/**
 * Formats a timestamp as time only (e.g., "9:02 AM")
 */
export function formatTimeOnly(utcTimestamp: string | Date | null | undefined): string {
  return formatInLocalTimezone(utcTimestamp, "h:mm a");
}

/**
 * Formats a timestamp as full date and time (e.g., "Nov 20, 2025 at 9:02 AM")
 */
export function formatFullDateTime(utcTimestamp: string | Date | null | undefined): string {
  return formatInLocalTimezone(utcTimestamp, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Gets the user's current timezone name (e.g., "America/Denver")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Gets a friendly timezone abbreviation (e.g., "MST" or "CST")
 */
export function getTimezoneAbbr(): string {
  const date = new Date();
  const timeString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
  const match = timeString.match(/\b[A-Z]{2,4}\b/);
  return match ? match[0] : "";
}
