import { format } from "date-fns";
import { ContentQueueItem } from "@/hooks/usePlanner";
import { Video, Image, FileText, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarDateCellProps {
  date: Date | null;
  items: ContentQueueItem[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onClickDay: () => void;
  onSelectItem: (item: ContentQueueItem) => void;
  onDropItem: (item: ContentQueueItem, targetDate: string) => void;
}

const getContentIcon = (type: string | null) => {
  switch (type) {
    case "reel":
    case "video":
      return Video;
    case "static":
    case "image":
      return Image;
    case "carousel":
      return LayoutGrid;
    default:
      return FileText;
  }
};

const getStatusColor = (status: string | null) => {
  switch (status) {
    case "scheduled":
      return "ring-blue-500/50 bg-blue-500/10";
    case "approved":
      return "ring-green-500/50 bg-green-500/10";
    case "deployed":
      return "ring-purple-500/50 bg-purple-500/10";
    case "review":
      return "ring-amber-500/50 bg-amber-500/10";
    default:
      return "ring-muted-foreground/30 bg-muted/30";
  }
};

const getPlatformEmoji = (platform: string | null | undefined) => {
  switch (platform) {
    case "instagram":
      return "📸";
    case "tiktok":
      return "🎵";
    case "facebook":
      return "📘";
    case "youtube":
      return "▶️";
    case "linkedin":
      return "💼";
    default:
      return "📱";
  }
};

export function CalendarDateCell({
  date,
  items,
  isToday,
  isCurrentMonth,
  onClickDay,
  onSelectItem,
  onDropItem,
}: CalendarDateCellProps) {
  const hasContent = items.length > 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-primary/10", "ring-2", "ring-primary/50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-primary/10", "ring-2", "ring-primary/50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-primary/10", "ring-2", "ring-primary/50");
    
    if (!date) return;
    
    try {
      const itemData = e.dataTransfer.getData("application/json");
      const item = JSON.parse(itemData) as ContentQueueItem;
      onDropItem(item, format(date, "yyyy-MM-dd"));
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  if (!date) {
    return (
      <div className="min-h-[120px] sm:min-h-[140px] bg-muted/10 border-r border-b border-border/30" />
    );
  }

  return (
    <div
      className={cn(
        "min-h-[120px] sm:min-h-[140px] p-2 border-r border-b border-border/30 cursor-pointer transition-all duration-200",
        "hover:bg-accent/30",
        isToday && "bg-gradient-to-br from-[#405DE6]/10 via-[#833AB4]/10 to-[#E1306C]/10 ring-2 ring-inset ring-[#833AB4]/50",
        !isCurrentMonth && "opacity-40"
      )}
      onClick={onClickDay}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Date Number */}
      <div className={cn(
        "text-xs font-medium mb-2 flex items-center justify-between",
        isToday ? "text-primary" : "text-muted-foreground"
      )}>
        <span className={cn(
          "w-6 h-6 flex items-center justify-center rounded-full",
          isToday && "bg-gradient-to-r from-[#405DE6] to-[#E1306C] text-white font-bold"
        )}>
          {format(date, "d")}
        </span>
        {hasContent && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
            {items.length}
          </span>
        )}
      </div>

      {/* Content Thumbnails */}
      {hasContent && (
        <div className="space-y-1.5">
          {items.slice(0, 3).map((item) => {
            const Icon = getContentIcon(item.content_type);
            const thumbnailUrl = item.output_url || item.media_urls?.[0];
            
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(item));
                  e.currentTarget.classList.add("opacity-50");
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove("opacity-50");
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem(item);
                }}
                className={cn(
                  "group flex items-center gap-1.5 p-1.5 rounded-md ring-1 transition-all cursor-grab active:cursor-grabbing",
                  "hover:ring-primary/50 hover:scale-[1.02]",
                  getStatusColor(item.status)
                )}
              >
                {/* Thumbnail or Icon */}
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                )}

                {/* Content Info */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-[10px] font-medium truncate text-foreground">
                    {item.title || item.content_type || "Untitled"}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span>{getPlatformEmoji(item.platform)}</span>
                    <span className="capitalize">{item.content_type}</span>
                  </div>
                </div>

                {/* Mobile: Just show platform emoji */}
                <span className="sm:hidden text-xs">{getPlatformEmoji(item.platform)}</span>
              </div>
            );
          })}

          {/* Overflow indicator */}
          {items.length > 3 && (
            <div className="text-[10px] text-center text-muted-foreground py-0.5 bg-muted/30 rounded">
              +{items.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasContent && (
        <div className="flex items-center justify-center h-16 text-muted-foreground/30">
          <span className="text-xs">Drop content</span>
        </div>
      )}
    </div>
  );
}
