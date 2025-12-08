import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Image as ImageIcon } from "lucide-react";
import { formatShortDate, formatTimeOnly } from "@/lib/timezone-utils";

interface VersionEntry {
  version: number;
  generated_at: string;
  views: string[];
}

interface VersionTimelineProps {
  history: VersionEntry[];
  currentVersion: number;
}

export default function VersionTimeline({ history, currentVersion }: VersionTimelineProps) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Version History</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((entry, index) => {
          const isCurrent = entry.version === currentVersion;
          
          return (
            <div 
              key={index} 
              className={`p-3 rounded-lg border ${
                isCurrent 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Version {entry.version}</span>
                  {isCurrent && (
                    <Badge variant="default" className="text-[10px] h-5">
                      Current
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatShortDate(entry.generated_at)} • {formatTimeOnly(entry.generated_at)}
                </span>
              </div>
              
              {entry.views && entry.views.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-3 h-3" />
                  <span>{entry.views.length} views generated</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
