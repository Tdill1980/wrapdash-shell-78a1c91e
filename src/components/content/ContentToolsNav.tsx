import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Box,
  Sparkles,
  Film,
} from "lucide-react";

const CONTENT_TOOLS = [
  {
    id: "mightytask",
    label: "MightyTask",
    path: "/mightytask",
    icon: CheckSquare,
    description: "Task orchestration",
  },
  {
    id: "contentbox",
    label: "ContentBox",
    path: "/contentbox",
    icon: Box,
    description: "Media & AI creation",
  },
  {
    id: "organic",
    label: "Organic Hub",
    path: "/organic",
    icon: Sparkles,
    description: "Reels & posts",
  },
  {
    id: "mighty-edit",
    label: "MightyEdit",
    path: "/mighty-edit",
    icon: Film,
    description: "Video editor",
  },
];

export function ContentToolsNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/organic") {
      return location.pathname.startsWith("/organic");
    }
    return location.pathname === path || location.pathname.startsWith(path + "?");
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
      {CONTENT_TOOLS.map((tool) => {
        const Icon = tool.icon;
        const active = isActive(tool.path);

        return (
          <button
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
              "hover:bg-background hover:text-foreground",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}
