import type { Scene } from "@/hooks/useYouTubeEditor";

interface SceneCardProps {
  scene: Scene;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function SceneCard({ scene, onSelect, isSelected }: SceneCardProps) {
  const colors: Record<string, string> = {
    hook: "from-pink-500 to-orange-500",
    value: "from-blue-500 to-purple-500",
    reveal: "from-green-400 to-emerald-600",
    cta: "from-yellow-500 to-red-500",
  };

  const bgColors: Record<string, string> = {
    hook: "bg-pink-500/20 border-pink-500/30",
    value: "bg-blue-500/20 border-blue-500/30",
    reveal: "bg-green-500/20 border-green-500/30",
    cta: "bg-yellow-500/20 border-yellow-500/30",
  };

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
        isSelected 
          ? "border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/50" 
          : `${bgColors[scene.type]} hover:border-pink-500/50`
      }`}
    >
      <div className={`text-xs px-2 py-1 inline-block rounded-md text-white font-semibold bg-gradient-to-r ${colors[scene.type]}`}>
        {scene.type.toUpperCase()}
      </div>

      <p className="text-muted-foreground text-xs mt-2">
        {scene.start} → {scene.end}
      </p>
      <p className="text-foreground mt-1 text-sm font-medium">
        Score: <span className={scene.score >= 85 ? "text-green-500" : scene.score >= 70 ? "text-yellow-500" : "text-red-500"}>{scene.score}</span>
      </p>
    </div>
  );
}
