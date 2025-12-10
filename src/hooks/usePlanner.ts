import { useState, useMemo } from "react";
import { useContentQueue } from "@/hooks/useContentQueue";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

export interface ContentQueueItem {
  id: string;
  organization_id: string | null;
  content_type: string | null;
  mode: string | null;
  title: string | null;
  caption: string | null;
  hashtags: string[] | null;
  cta_text: string | null;
  media_urls: string[] | null;
  output_url: string | null;
  scheduled_for: string | null;
  status: string | null;
  platform?: string | null;
}

/**
 * usePlanner
 *
 * Core logic used by the Content Planner Calendar.
 * Provides:
 * - Items grouped by date
 * - Selected item handling
 * - Selected date handling
 * - Drag & drop scheduling
 * - Month navigation
 */
export function usePlanner(organizationId?: string) {
  const {
    items,
    groupedByDate,
    updateStatus,
    isLoading,
    refetch,
  } = useContentQueue(organizationId);

  const [selectedItem, setSelectedItem] = useState<ContentQueueItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all days in current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group items by date string (YYYY-MM-DD)
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, ContentQueueItem[]> = {};
    
    items.forEach((item) => {
      if (item.scheduled_for) {
        const dateKey = item.scheduled_for.split("T")[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(item);
      }
    });
    
    return grouped;
  }, [items]);

  // Get items for a specific date
  const getItemsForDate = (date: Date): ContentQueueItem[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return itemsByDate[dateKey] || [];
  };

  // Navigate months
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  /**
   * Handles dropping a content item on a different date cell.
   */
  const onDropItem = async (item: ContentQueueItem, targetDate: string) => {
    try {
      await updateStatus.mutateAsync({
        id: item.id,
        status: "scheduled",
        scheduled_for: `${targetDate}T12:00:00Z`,
      });
    } catch (err) {
      console.error("Error rescheduling item:", err);
    }
  };

  /**
   * Check if a date is today
   */
  const isToday = (date: Date) => isSameDay(date, new Date());

  /**
   * Check if a date is in the current month
   */
  const isCurrentMonth = (date: Date) => 
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  return {
    items,
    groupedByDate,
    itemsByDate,
    selectedItem,
    setSelectedItem,
    selectedDate,
    setSelectedDate,
    onDropItem,
    isLoading,
    refetch,
    // Month navigation
    currentMonth,
    setCurrentMonth,
    daysInMonth,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    // Helpers
    getItemsForDate,
    isToday,
    isCurrentMonth,
  };
}
