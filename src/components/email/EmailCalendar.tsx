import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Check, Clock, FileText } from 'lucide-react';
import { 
  WEEKLY_SCHEDULE, 
  FRANCHISES, 
  getCurrentWeekSlot,
  type WeekSlot,
  type FranchiseId 
} from '@/lib/email-content/franchises';
import { cn } from '@/lib/utils';

interface ScheduledEmail {
  week: WeekSlot;
  franchiseId: FranchiseId;
  status: 'draft' | 'scheduled' | 'sent';
  subject?: string;
  scheduledDate?: Date;
}

interface EmailCalendarProps {
  scheduledEmails?: ScheduledEmail[];
  onSelectWeek?: (week: WeekSlot) => void;
  onSelectFranchise?: (franchiseId: FranchiseId) => void;
}

export function EmailCalendar({ 
  scheduledEmails = [], 
  onSelectWeek,
  onSelectFranchise 
}: EmailCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentWeek = getCurrentWeekSlot();

  const getStatusBadge = (status: 'draft' | 'scheduled' | 'sent') => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
    }
  };

  const getEmailForWeek = (week: WeekSlot): ScheduledEmail | undefined => {
    return scheduledEmails.find(e => e.week === week);
  };

  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-[#FF1493]" />
            Email Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {WEEKLY_SCHEDULE.map((schedule) => {
          const scheduledEmail = getEmailForWeek(schedule.week);
          const franchise = FRANCHISES[schedule.primaryFranchise];
          const isCurrentWeek = schedule.week === currentWeek;

          return (
            <div
              key={schedule.week}
              className={cn(
                "p-3 rounded-lg border transition-colors cursor-pointer hover:border-primary/50",
                isCurrentWeek ? "border-[#FF1493]/50 bg-[#FF1493]/5" : "border-border/50",
                scheduledEmail?.status === 'sent' && "bg-green-500/5"
              )}
              onClick={() => {
                onSelectWeek?.(schedule.week);
                onSelectFranchise?.(schedule.primaryFranchise);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Week {schedule.week}
                    </span>
                    {isCurrentWeek && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#FF1493]/50 text-[#FF1493]">
                        This Week
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: franchise.color }} 
                    />
                    <span className="font-medium text-sm truncate">
                      {franchise.name}
                    </span>
                    {franchise.host && (
                      <span className="text-xs text-muted-foreground truncate">
                        — {franchise.host}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schedule.label}
                  </p>
                  {schedule.alternates.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {schedule.alternates.map(altId => (
                        <Badge 
                          key={altId} 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0"
                          style={{ borderColor: FRANCHISES[altId].color + '40', color: FRANCHISES[altId].color }}
                        >
                          {FRANCHISES[altId].name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {scheduledEmail ? (
                    getStatusBadge(scheduledEmail.status)
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Scheduled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Cadence Legend:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">
              Week 1: Authority
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Week 2: Execution
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Week 3: Community
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Week 4: Editorial
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailCalendar;
