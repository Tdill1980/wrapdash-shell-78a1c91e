import { useNavigate } from "react-router-dom";
import { Video, Sparkles, Calendar, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ContentFactoryCard() {
  const navigate = useNavigate();

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]">
            <Video className="h-4 w-4 text-white" />
          </div>
          <span>AI Content</span>
          <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">
            Factory
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Create reels, ads & repurpose content with AI
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3 gap-1 hover:border-primary/50"
            onClick={() => navigate("/contentbox")}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs">Create</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3 gap-1 hover:border-primary/50"
            onClick={() => navigate("/contentbox")}
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs">Generate</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3 gap-1 hover:border-primary/50"
            onClick={() => navigate("/content-schedule")}
          >
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span className="text-xs">Schedule</span>
          </Button>
        </div>
        <Button
          className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E] text-white"
          onClick={() => navigate("/contentbox")}
        >
          Open Content Factory
        </Button>
      </CardContent>
    </Card>
  );
}
