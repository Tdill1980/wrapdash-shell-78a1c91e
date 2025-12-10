import { useEditorMode, EditorMode } from "@/contexts/EditorModeContext";
import { cn } from "@/lib/utils";
import { 
  Wrench, 
  Sparkles, 
  Zap, 
  Shuffle, 
  Video 
} from "lucide-react";

const modes: { id: EditorMode; label: string; icon: React.ReactNode }[] = [
  { id: "basic", label: "Basic Tools", icon: <Wrench className="w-4 h-4" /> },
  { id: "smart_assist", label: "Smart Assist", icon: <Sparkles className="w-4 h-4" /> },
  { id: "auto_create", label: "Auto Create", icon: <Zap className="w-4 h-4" /> },
  { id: "hybrid", label: "Hybrid", icon: <Shuffle className="w-4 h-4" /> },
  { id: "render", label: "Render", icon: <Video className="w-4 h-4" /> },
];

export function EditorModeTabs() {
  const { mode, setMode } = useEditorMode();

  return (
    <div className="flex gap-1 sm:gap-2 border-b border-border pb-2 mb-4 overflow-x-auto no-scrollbar">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all font-medium",
            mode === m.id
              ? "bg-gradient-to-r from-[hsl(var(--instagram-blue))] to-[hsl(var(--instagram-pink))] text-white shadow-md"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {m.icon}
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
