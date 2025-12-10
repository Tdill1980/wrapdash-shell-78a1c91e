import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { usePlanner, ContentQueueItem } from "@/hooks/usePlanner";
import { CalendarDateCell } from "./CalendarDateCell";
import { ContentPreviewWorkspace } from "./ContentPreviewWorkspace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";

interface ContentPlannerCalendarProps {
  organizationId?: string;
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ContentPlannerCalendar({ organizationId }: ContentPlannerCalendarProps) {
  const {
    items,
    itemsByDate,
    selectedItem,
    setSelectedItem,
    selectedDate,
    setSelectedDate,
    onDropItem,
    isLoading,
    currentMonth,
    daysInMonth,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    getItemsForDate,
    isToday,
  } = usePlanner(organizationId);

  // Build calendar grid with padding for first day of month
  const firstDayOfMonth = daysInMonth[0];
  const startPadding = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  
  const calendarDays = [
    ...Array(startPadding).fill(null),
    ...daysInMonth,
  ];

  // Ensure we have complete weeks (pad end)
  const endPadding = (7 - (calendarDays.length % 7)) % 7;
  const fullCalendarDays = [...calendarDays, ...Array(endPadding).fill(null)];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#E1306C]">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">
              Content Planner
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length} items scheduled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          
          <h3 className="text-lg font-semibold min-w-[160px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Draft", count: items.filter(i => !i.status || i.status === "draft").length, color: "from-amber-500 to-orange-500" },
          { label: "Scheduled", count: items.filter(i => i.status === "scheduled").length, color: "from-blue-500 to-cyan-500" },
          { label: "Approved", count: items.filter(i => i.status === "approved").length, color: "from-green-500 to-emerald-500" },
          { label: "Deployed", count: items.filter(i => i.status === "deployed").length, color: "from-purple-500 to-pink-500" },
        ].map(stat => (
          <Card key={stat.label} className="p-3 bg-card/50 border-border/50">
            <p className={`text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.count}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
            {WEEKDAY_HEADERS.map(day => (
              <div 
                key={day} 
                className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7">
            {fullCalendarDays.map((day, index) => (
              <CalendarDateCell
                key={index}
                date={day}
                items={day ? getItemsForDate(day) : []}
                isToday={day ? isToday(day) : false}
                isCurrentMonth={day !== null}
                onClickDay={() => day && setSelectedDate(format(day, "yyyy-MM-dd"))}
                onSelectItem={setSelectedItem}
                onDropItem={onDropItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Workspace Modal */}
      {selectedItem && (
        <ContentPreviewWorkspace
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
