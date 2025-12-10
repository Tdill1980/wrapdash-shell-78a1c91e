import { useEditorMode, EditorMode } from "@/contexts/EditorModeContext";
import { cn } from "@/lib/utils";
import { 
  Scissors, 
  Type, 
  Sparkles, 
  Timer, 
  Gauge, 
  Image,
  BarChart3,
  ListVideo,
  Clock,
  MessageSquare,
  Layers,
  FileText,
  Zap,
  Wand2,
  Music,
  Palette,
  FileImage,
  Monitor,
  Link
} from "lucide-react";

interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const TOOL_SECTIONS: Record<EditorMode, ToolItem[]> = {
  basic: [
    { id: "auto_cut", label: "Auto Cut", icon: <Scissors className="w-4 h-4" /> },
    { id: "auto_captions", label: "Auto Captions", icon: <Type className="w-4 h-4" /> },
    { id: "enhance", label: "Enhance", icon: <Sparkles className="w-4 h-4" /> },
    { id: "trim", label: "Trim", icon: <Timer className="w-4 h-4" /> },
    { id: "speed", label: "Speed", icon: <Gauge className="w-4 h-4" /> },
    { id: "export_frame", label: "Export Frame", icon: <Image className="w-4 h-4" /> },
  ],
  smart_assist: [
    { id: "clip_analyzer", label: "Clip Analyzer", icon: <BarChart3 className="w-4 h-4" />, disabled: true },
    { id: "best_scenes", label: "Best Scenes", icon: <ListVideo className="w-4 h-4" />, disabled: true },
    { id: "suggested_timeline", label: "Suggested Timeline", icon: <Clock className="w-4 h-4" />, disabled: true },
    { id: "hook_cta", label: "Hook & CTA Suggestions", icon: <MessageSquare className="w-4 h-4" />, disabled: true },
    { id: "overlay_suggestions", label: "Overlay Suggestions", icon: <Layers className="w-4 h-4" />, disabled: true },
    { id: "creative_notes", label: "Creative Notes", icon: <FileText className="w-4 h-4" />, disabled: true },
  ],
  auto_create: [
    { id: "auto_timeline", label: "Auto Timeline", icon: <Zap className="w-4 h-4" />, disabled: true },
    { id: "variant_generator", label: "Variant Generator", icon: <Wand2 className="w-4 h-4" />, disabled: true },
    { id: "auto_captions_ac", label: "Auto Captions", icon: <Type className="w-4 h-4" />, disabled: true },
    { id: "auto_cta", label: "Auto CTA", icon: <MessageSquare className="w-4 h-4" />, disabled: true },
    { id: "auto_music", label: "Auto Music", icon: <Music className="w-4 h-4" />, disabled: true },
  ],
  hybrid: [
    { id: "brief_builder", label: "Brief Builder", icon: <FileText className="w-4 h-4" /> },
    { id: "reference_picker", label: "Reference Picker", icon: <Link className="w-4 h-4" /> },
    { id: "asset_selector", label: "Asset Selector", icon: <Image className="w-4 h-4" /> },
  ],
  render: [
    { id: "multi_platform", label: "Multi-Platform Export", icon: <Monitor className="w-4 h-4" /> },
    { id: "thumbnail_picker", label: "Thumbnail Picker", icon: <FileImage className="w-4 h-4" /> },
    { id: "branding_controls", label: "Branding Controls", icon: <Palette className="w-4 h-4" /> },
  ],
};

const MODE_LABELS: Record<EditorMode, string> = {
  basic: "Basic Tools",
  smart_assist: "Smart Assist",
  auto_create: "Auto Create",
  hybrid: "Hybrid Mode",
  render: "Render",
};

interface EditorToolSidebarProps {
  onToolSelect?: (toolId: string) => void;
  selectedTool?: string | null;
}

export function EditorToolSidebar({ onToolSelect, selectedTool }: EditorToolSidebarProps) {
  const { mode } = useEditorMode();
  const tools = TOOL_SECTIONS[mode] || [];

  return (
    <div className="w-48 min-w-[12rem] bg-muted/30 border-r border-border py-4 space-y-1 hidden md:block">
      <h3 className="text-xs font-semibold px-4 mb-3 uppercase tracking-wide text-muted-foreground">
        {MODE_LABELS[mode]}
      </h3>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => !tool.disabled && onToolSelect?.(tool.id)}
          disabled={tool.disabled}
          className={cn(
            "w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm transition-colors",
            selectedTool === tool.id
              ? "bg-primary/10 text-primary border-r-2 border-primary"
              : "hover:bg-muted/50 text-foreground",
            tool.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {tool.icon}
          <span className="truncate">{tool.label}</span>
          {tool.disabled && (
            <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
          )}
        </button>
      ))}
    </div>
  );
}
