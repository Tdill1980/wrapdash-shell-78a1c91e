import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Image, Layers, Megaphone, Clock, Sparkles, 
  Plus, ArrowRight, Calendar, Zap, Film, ImagePlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContentQueue } from "@/hooks/useContentQueue";
import { format } from "date-fns";
import { MainLayout } from "@/layouts/MainLayout";

const CONTENT_TYPES = [
  { id: "reel", label: "Reel", icon: Video, color: "from-pink-500 to-purple-500", route: "/contentbox" },
  { id: "static", label: "Static Post", icon: Image, color: "from-blue-500 to-cyan-500", route: "/contentbox" },
  { id: "carousel", label: "Carousel", icon: Layers, color: "from-green-500 to-emerald-500", route: "/contentbox" },
  { id: "ad", label: "Paid Ad", icon: Megaphone, color: "from-orange-500 to-red-500", route: "/contentbox" },
  { id: "story", label: "Story", icon: Clock, color: "from-purple-500 to-pink-500", route: "/contentbox" },
  { id: "before-after", label: "Before/After", icon: ImagePlus, color: "from-amber-500 to-yellow-500", route: "/contentbox" },
];

const QUICK_ACTIONS = [
  { label: "Batch Generate 7 Days", icon: Calendar, description: "AI creates a week of content" },
  { label: "Generate 3 Variants", icon: Sparkles, description: "Create A/B test versions" },
  { label: "Import Canva Template", icon: Film, description: "Convert Canva designs" },
];

const AI_SUGGESTIONS = [
  { type: "reel", title: "Chrome delete reveal reel", hook: "Wait for the transformation...", tags: ["trending", "chrome delete"] },
  { type: "static", title: "Satin black promo post", hook: "The finish that turns heads", tags: ["promo", "satin"] },
  { type: "carousel", title: "G-Wagon wrap process", hook: "5 steps to perfection", tags: ["luxury", "process"] },
  { type: "story", title: "Shop culture moment", hook: "Behind the scenes", tags: ["authentic", "team"] },
];

export default function ContentCreator() {
  const navigate = useNavigate();
  const { items, isLoading } = useContentQueue();
  
  const recentItems = items?.slice(0, 5) || [];

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "approved": return "bg-blue-500";
      case "scheduled": return "bg-green-500";
      case "deployed": return "bg-purple-500";
      case "review": return "bg-amber-500";
      default: return "bg-muted";
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">
              Content <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Creator</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, schedule, and publish content across all platforms
            </p>
          </div>

          {/* Content Type Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Content
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CONTENT_TYPES.map((type) => (
                <Card 
                  key={type.id}
                  className="cursor-pointer hover:border-primary/50 transition-all hover:scale-105 group"
                  onClick={() => navigate(type.route, { state: { contentType: type.id } })}
                >
                  <CardContent className="pt-6 text-center">
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-sm">{type.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* AI Suggestions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Suggested for You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AI_SUGGESTIONS.map((suggestion, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate("/contentbox", { state: { suggestion } })}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">{suggestion.type}</Badge>
                      <div>
                        <p className="font-medium text-sm">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground">"{suggestion.hook}"</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {suggestion.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Weekly Content Plan
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {QUICK_ACTIONS.map((action, i) => (
                  <Button 
                    key={i}
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                  >
                    <action.icon className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Creations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Creations</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/content-schedule")}>
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : recentItems.length === 0 ? (
                <div className="text-center py-8">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No content created yet</p>
                  <Button className="mt-4" onClick={() => navigate("/contentbox")}>
                    Create Your First Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {item.content_type || "content"}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">
                            {item.title || item.caption?.slice(0, 40) || "Untitled"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.created_at ? format(new Date(item.created_at), "MMM d, h:mm a") : ""}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status || "draft"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
