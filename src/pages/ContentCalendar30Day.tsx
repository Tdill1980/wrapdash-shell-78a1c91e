import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/layouts/MainLayout';
import { cn } from '@/lib/utils';

interface ScheduledContent {
  id: string;
  title: string | null;
  brand: string;
  content_type: string;
  platform: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string | null;
  caption: string | null;
}

// Channel/Brand definitions - 4 unified buttons in order
const CHANNELS = [
  { id: 'all', name: 'All Channels', color: 'bg-muted', borderColor: 'border-muted-foreground' },
  { id: 'ink-edge-publisher', name: 'Ink & Edge Publisher', color: 'bg-indigo-600', borderColor: 'border-indigo-600', bgLight: 'bg-indigo-600/10' },
  { id: 'wpw', name: 'WePrintWraps.com', color: 'bg-red-500', borderColor: 'border-red-500', bgLight: 'bg-red-500/10' },
  { id: 'wraptv', name: 'WrapTVWorld', color: 'bg-purple-500', borderColor: 'border-purple-500', bgLight: 'bg-purple-500/10' },
  { id: 'ink-edge-content', name: 'Ink & Edge Content', color: 'bg-pink-500', borderColor: 'border-pink-500', bgLight: 'bg-pink-500/10' },
];

// Content type definitions with icons
const CONTENT_TYPES = [
  { id: 'story', label: 'Story', icon: '📖', description: 'Instagram/Facebook Story' },
  { id: 'reel', label: 'Organic Reel', icon: '🎬', description: 'Unpaid reel content' },
  { id: 'reel-ad', label: 'Reel Ad', icon: '📢', description: 'Paid reel promotion' },
  { id: 'static-ad', label: 'Static Ad', icon: '🖼️', description: 'Image-based ad' },
  { id: 'email', label: 'Email', icon: '✉️', description: 'Klaviyo campaigns' },
  { id: 'article', label: 'Article', icon: '📰', description: 'Magazine content' },
  { id: 'short', label: 'Short', icon: '⚡', description: 'YouTube Shorts / TikTok' },
  { id: 'ad', label: 'Ad', icon: '💰', description: 'Paid advertisement' },
];

export default function ContentCalendar30Day() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedChannel, setSelectedChannel] = useState('all');

  // Fetch scheduled content
  const { data: scheduledContent = [], isLoading } = useQuery({
    queryKey: ['content-calendar-30day'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as ScheduledContent[];
    }
  });

  // Generate calendar days for the month (including padding days)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Filter content by selected channel
  const filteredContent = useMemo(() => {
    if (selectedChannel === 'all') return scheduledContent;
    return scheduledContent.filter(item => {
      const brandLower = item.brand.toLowerCase();
      // Map database brand values to our channel IDs
      if (selectedChannel === 'ink-edge-publisher') {
        return brandLower === 'ink-edge' || brandLower === 'inkedge' || brandLower === 'ink-edge-publisher';
      }
      if (selectedChannel === 'ink-edge-content') {
        return brandLower === 'ink-edge-content' || brandLower === 'ink-edge-dist';
      }
      if (selectedChannel === 'wpw') {
        return brandLower === 'wpw';
      }
      if (selectedChannel === 'wraptv') {
        return brandLower === 'wraptv' || brandLower === 'wraptvworld';
      }
      return false;
    });
  }, [scheduledContent, selectedChannel]);

  // Group content by date
  const contentByDate = useMemo(() => {
    return filteredContent.reduce((acc, item) => {
      const date = item.scheduled_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {} as Record<string, ScheduledContent[]>);
  }, [filteredContent]);

  // Stats by channel
  const statsByChannel = useMemo(() => {
    const stats: Record<string, number> = {
      'ink-edge-publisher': 0,
      wpw: 0,
      wraptv: 0,
      'ink-edge-content': 0,
    };
    scheduledContent.forEach(item => {
      const brand = item.brand.toLowerCase();
      if (brand === 'wpw') stats.wpw++;
      else if (brand === 'ink-edge' || brand === 'inkedge' || brand === 'ink-edge-publisher') stats['ink-edge-publisher']++;
      else if (brand === 'wraptv' || brand === 'wraptvworld') stats.wraptv++;
      else if (brand === 'ink-edge-content' || brand === 'ink-edge-dist') stats['ink-edge-content']++;
    });
    return stats;
  }, [scheduledContent]);

  // Stats by content type
  const statsByType = useMemo(() => {
    const stats: Record<string, number> = {};
    scheduledContent.forEach(item => {
      const type = item.content_type.toLowerCase();
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }, [scheduledContent]);

  const getChannelStyle = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower === 'ink-edge' || brandLower === 'inkedge' || brandLower === 'ink-edge-publisher') {
      return { border: 'border-l-4 border-l-indigo-600', bg: 'bg-indigo-600/10' };
    }
    if (brandLower === 'wpw') return { border: 'border-l-4 border-l-red-500', bg: 'bg-red-500/10' };
    if (brandLower === 'wraptv' || brandLower === 'wraptvworld') return { border: 'border-l-4 border-l-purple-500', bg: 'bg-purple-500/10' };
    if (brandLower === 'ink-edge-content' || brandLower === 'ink-edge-dist') return { border: 'border-l-4 border-l-pink-500', bg: 'bg-pink-500/10' };
    return { border: 'border-l-4 border-l-muted', bg: 'bg-muted/10' };
  };

  const getContentTypeInfo = (type: string) => {
    const typeLower = type.toLowerCase();
    // Handle compound types like "reel-ad" or "static-ad"
    if (typeLower.includes('reel') && typeLower.includes('ad')) {
      return CONTENT_TYPES.find(t => t.id === 'reel-ad') || CONTENT_TYPES[0];
    }
    if (typeLower.includes('static') && typeLower.includes('ad')) {
      return CONTENT_TYPES.find(t => t.id === 'static-ad') || CONTENT_TYPES[0];
    }
    return CONTENT_TYPES.find(t => t.id === typeLower) || 
           CONTENT_TYPES.find(t => typeLower.includes(t.id)) ||
           { id: type, label: type, icon: '📌', description: type };
  };

  const getChannelLabel = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower === 'ink-edge' || brandLower === 'inkedge' || brandLower === 'ink-edge-publisher') return 'I&E Publisher';
    if (brandLower === 'wpw') return 'WPW';
    if (brandLower === 'wraptv' || brandLower === 'wraptvworld') return 'WrapTV';
    if (brandLower === 'ink-edge-content' || brandLower === 'ink-edge-dist') return 'I&E Content';
    return brand;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Read-Only Banner */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border border-border">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">📅 Read-only Reference View</p>
            <p className="text-sm text-muted-foreground">
              Execute tasks from MightyTask channels: Ink & Edge Magazine, WPW Campaigns, Distribution, or WrapTVWorld.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Content Calendar
            </h1>
            <p className="text-muted-foreground">30-day view across all channels (read-only)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-indigo-600">
            <CardContent className="py-3 px-4">
              <p className="text-2xl font-bold">{statsByChannel['ink-edge-publisher']}</p>
              <p className="text-xs text-muted-foreground">I&E Publisher</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="py-3 px-4">
              <p className="text-2xl font-bold">{statsByChannel.wpw}</p>
              <p className="text-xs text-muted-foreground">WePrintWraps.com</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="py-3 px-4">
              <p className="text-2xl font-bold">{statsByChannel.wraptv}</p>
              <p className="text-xs text-muted-foreground">WrapTVWorld</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-pink-500">
            <CardContent className="py-3 px-4">
              <p className="text-2xl font-bold">{statsByChannel['ink-edge-content']}</p>
              <p className="text-xs text-muted-foreground">I&E Content</p>
            </CardContent>
          </Card>
        </div>

        {/* Channel Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {CHANNELS.map(channel => (
            <Button
              key={channel.id}
              variant={selectedChannel === channel.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChannel(channel.id)}
              className={cn(
                selectedChannel === channel.id && channel.id !== 'all' && `${channel.color} text-white hover:opacity-90`
              )}
            >
              {channel.id !== 'all' && (
                <span className={cn('w-2 h-2 rounded-full mr-2', channel.color)} />
              )}
              {channel.name}
            </Button>
          ))}
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <CardTitle className="text-xl">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayContent = contentByDate[dateStr] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    className={cn(
                      'min-h-[120px] border rounded-lg p-1 transition-colors',
                      isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                      isToday && 'ring-2 ring-primary'
                    )}
                  >
                    {/* Day Number */}
                    <div className={cn(
                      'text-sm font-medium mb-1 px-1',
                      !isCurrentMonth && 'text-muted-foreground/50',
                      isToday && 'text-primary font-bold'
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Content Items */}
                    <div className="space-y-1 overflow-y-auto max-h-[90px]">
                      {dayContent.slice(0, 3).map((item) => {
                        const channelStyle = getChannelStyle(item.brand);
                        const typeInfo = getContentTypeInfo(item.content_type);
                        
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'text-[10px] p-1 rounded cursor-pointer hover:opacity-80 transition-opacity',
                              channelStyle.border,
                              channelStyle.bg
                            )}
                            title={`${getChannelLabel(item.brand)} - ${typeInfo.label}: ${item.title || 'Untitled'}`}
                          >
                            <div className="flex items-center gap-1">
                              <span>{typeInfo.icon}</span>
                              <span className="font-medium truncate">
                                {getChannelLabel(item.brand)}
                              </span>
                            </div>
                            <div className="truncate text-muted-foreground">
                              {typeInfo.label}
                            </div>
                          </div>
                        );
                      })}
                      {dayContent.length > 3 && (
                        <div className="text-[10px] text-center text-muted-foreground">
                          +{dayContent.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {/* Channels */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Channels</p>
                <div className="flex flex-wrap gap-3">
                  {CHANNELS.filter(c => c.id !== 'all').map(channel => (
                    <div key={channel.id} className="flex items-center gap-1.5 text-sm">
                      <span className={cn('w-3 h-3 rounded', channel.color)} />
                      {channel.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Content Types</p>
                <div className="flex flex-wrap gap-3">
                  {CONTENT_TYPES.map(type => (
                    <div key={type.id} className="flex items-center gap-1 text-sm">
                      <span>{type.icon}</span>
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading calendar...
          </div>
        )}
      </div>
    </MainLayout>
  );
}
