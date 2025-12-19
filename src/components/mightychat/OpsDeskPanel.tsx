import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Cog } from "lucide-react";

interface OpsDeskPanelProps {
  onTaskSelect?: (taskId: string) => void;
}

export function OpsDeskPanel({ onTaskSelect }: OpsDeskPanelProps) {
  // Ops Desk is now deprecated - all tasks appear in Review Queue
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cog className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">OPS DESK</span>
          </CardTitle>
          <Badge variant="secondary">0 Pending</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          All tasks now appear in Review Queue
        </p>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex items-center justify-center">
        <div className="p-8 text-muted-foreground text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
          <p className="font-medium mb-2">Ops Desk Consolidated</p>
          <p className="text-sm">
            All pending tasks and conversations are now unified in the{" "}
            <span className="font-semibold text-foreground">Review Queue</span> tab.
          </p>
        </div>
      </CardContent>

      {/* Footer Rule */}
      <div className="p-3 border-t bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground italic">
          Talk in chat. Review in Queue. Design in ApproveFlow.
        </p>
      </div>
    </Card>
  );
}
