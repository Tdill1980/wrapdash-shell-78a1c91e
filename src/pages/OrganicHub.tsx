import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Film,
  Scissors,
  Wand2,
  Images,
  Sparkles,
  ChevronRight,
  Link2,
  Zap,
  TrendingUp,
  Play,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OrganicHub() {
  const navigate = useNavigate();

  const tools = [
    {
      id: "reel_builder",
      label: "Multi-Clip Reel Builder",
      description: "Combine multiple clips, trim, sequence, pace — AI assisted timeline.",
      icon: <Film className="w-6 h-6" />,
      path: "/organic/reel-builder",
      gradient: "from-[#405DE6] to-[#833AB4]",
      badge: "Popular",
    },
    {
      id: "inspo_scrubber",
      label: "Inspo Scrubber",
      description: "Paste any IG/TikTok link — AI extracts pacing, overlays, hooks.",
      icon: <Link2 className="w-6 h-6" />,
      path: "/organic/inspo",
      gradient: "from-[#833AB4] to-[#E1306C]",
      badge: "New",
    },
    {
      id: "auto_split",
      label: "Auto-Split Engine",
      description: "Upload long videos — AI cuts into 5 viral short-form reels.",
      icon: <Scissors className="w-6 h-6" />,
      path: "/organic/auto-split",
      gradient: "from-[#E1306C] to-[#F77737]",
      badge: null,
    },
    {
      id: "static_creator",
      label: "Static / Carousel Creator",
      description: "Create organic static posts & carousels with AI copy.",
      icon: <Images className="w-6 h-6" />,
      path: "/organic/static",
      gradient: "from-[#F77737] to-[#FCAF45]",
      badge: null,
    },
  ];

  const quickStats = [
    { label: "Reels Created", value: "24", icon: <Film className="w-4 h-4" /> },
    { label: "Avg. Engagement", value: "4.2%", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "This Week", value: "7", icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">
                Organic Creation Hub
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Reels, stories, static posts — everything optimized for viral growth.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="text-center px-4 py-2 rounded-xl bg-card/50 border border-border/50"
              >
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                  {stat.icon}
                  {stat.label}
                </div>
                <div className="text-xl font-bold mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tool Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Creation Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              className="group cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
              onClick={() => navigate(tool.path)}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-5">
                  <div
                    className={cn(
                      "p-3 rounded-xl bg-gradient-to-br text-white shrink-0",
                      tool.gradient
                    )}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tool.label}</h3>
                      {tool.badge && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>
                <div
                  className={cn(
                    "h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r",
                    tool.gradient
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate("/organic/reel-builder")}
            className="bg-gradient-to-r from-[#405DE6] to-[#E1306C] hover:opacity-90"
          >
            <Film className="w-4 h-4 mr-2" />
            Create Reel
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/organic/inspo")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Scrub Inspo
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/organic/auto-split")}
          >
            <Scissors className="w-4 h-4 mr-2" />
            Auto-Split Video
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/content-schedule")}
          >
            <Play className="w-4 h-4 mr-2" />
            View Scheduler
          </Button>
        </div>
      </div>

      {/* Reel Vault Preview */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Reels</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View Reel Vault →
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center"
            >
              <div className="text-center text-muted-foreground">
                <Film className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <span className="text-xs">No reel</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
