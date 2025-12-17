import { useNavigate } from "react-router-dom";
import { Video, Sparkles, Calendar, Zap, Heart, Palette, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AskAgentButton } from "@/components/mightychat/AskAgentButton";

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
          Create reels, ads & repurpose content with AI agents
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Agent Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <AskAgentButton
            agentId="emily_carter"
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3 gap-1 hover:border-purple-500/50 text-xs"
            context={{ type: "content_request", content_type: "marketing" }}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Emily</span>
            <span className="text-[10px] text-muted-foreground">Marketing</span>
          </AskAgentButton>
          <AskAgentButton
            agentId="casey_ramirez"
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3 gap-1 hover:border-pink-500/50 text-xs"
            context={{ type: "content_request", content_type: "affiliate" }}
          >
            <Heart className="h-4 w-4 text-pink-500" />
            <span>Casey</span>
            <span className="text-[10px] text-muted-foreground">Affiliates</span>
          </AskAgentButton>
          <AskAgentButton
            agentId="noah_bennett"
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3 gap-1 hover:border-amber-500/50 text-xs"
            context={{ type: "content_request", content_type: "video" }}
          >
            <Film className="h-4 w-4 text-amber-500" />
            <span>Noah</span>
            <span className="text-[10px] text-muted-foreground">Video</span>
          </AskAgentButton>
        </div>

        {/* Quick Tools */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-2 gap-1 hover:border-primary/50"
            onClick={() => navigate("/contentbox")}
          >
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-[10px]">Create</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-2 gap-1 hover:border-primary/50"
            onClick={() => navigate("/contentbox")}
          >
            <Palette className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px]">Generate</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-2 gap-1 hover:border-primary/50"
            onClick={() => navigate("/content-schedule")}
          >
            <Calendar className="h-3 w-3 text-blue-500" />
            <span className="text-[10px]">Schedule</span>
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
