import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ListTodo, 
  Boxes, 
  Sparkles, 
  Film 
} from "lucide-react";

const contentTools = [
  {
    name: "MightyTask",
    description: "Task management",
    icon: ListTodo,
    route: "/mightytask",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "ContentBox",
    description: "Media library",
    icon: Boxes,
    route: "/contentbox",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    name: "Organic Hub",
    description: "Reel builder",
    icon: Sparkles,
    route: "/organic",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    name: "MightyEdit",
    description: "Video editor",
    icon: Film,
    route: "/mighty-edit",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function ContentToolsCard() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="dashboard-card-title text-lg font-bold font-poppins">
              <span className="text-foreground">Content</span>
              <span className="text-gradient"> Tools</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Quick access to content creation suite
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {contentTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = location.pathname === tool.route;
            
            return (
              <Button
                key={tool.route}
                variant="outline"
                onClick={() => navigate(tool.route)}
                className={`h-auto flex flex-col items-center gap-2 p-4 hover:border-primary/50 transition-all ${
                  isActive ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
