import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchDesignPanels, DesignPanel } from "../panel-api";
import { Search, Loader2, Check, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface LibraryPanelSelectorProps {
  onPanelSelected: (url: string, panel: DesignPanel) => void;
}

export function LibraryPanelSelector({ onPanelSelected }: LibraryPanelSelectorProps) {
  const [panels, setPanels] = useState<DesignPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadPanels();
  }, []);

  const loadPanels = async () => {
    try {
      setLoading(true);
      const data = await fetchDesignPanels();
      setPanels(data);
    } catch (error) {
      console.error("Error loading panels:", error);
      toast.error("Failed to load panel library");
    } finally {
      setLoading(false);
    }
  };

  const filteredPanels = panels.filter((panel) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      panel.vehicle_make?.toLowerCase().includes(query) ||
      panel.vehicle_model?.toLowerCase().includes(query) ||
      panel.style.toLowerCase().includes(query) ||
      panel.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleSelect = (panel: DesignPanel) => {
    setSelectedId(panel.id);
    onPanelSelected(panel.panel_preview_url, panel);
    toast.success("Panel selected!");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Select from Library
        </h3>
        <span className="text-sm text-muted-foreground">
          {filteredPanels.length} panels available
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by vehicle, style, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPanels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No panels found in your library.</p>
          <p className="text-sm mt-1">Generate some panels with AI first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
          {filteredPanels.map((panel) => (
            <div
              key={panel.id}
              onClick={() => handleSelect(panel)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                ${selectedId === panel.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-transparent hover:border-primary/50"
                }
              `}
            >
              <img
                src={panel.thumbnail_url || panel.panel_preview_url}
                alt={panel.style}
                className="w-full aspect-square object-cover"
              />
              {selectedId === panel.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white font-medium truncate capitalize">
                  {panel.style}
                </p>
                {panel.vehicle_make && (
                  <p className="text-xs text-white/70 truncate">
                    {panel.vehicle_year} {panel.vehicle_make} {panel.vehicle_model}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
