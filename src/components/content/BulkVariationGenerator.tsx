import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Loader2, 
  Image, 
  Video, 
  Lightbulb, 
  Users, 
  Layout, 
  Palette,
  Check,
  X,
  ChevronRight,
  Zap
} from "lucide-react";
import { useBulkVariations, BulkVariationConfig } from "@/hooks/useBulkVariations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BulkVariationGeneratorProps {
  open: boolean;
  onClose: () => void;
  preselectedMediaIds?: string[];
  onComplete?: (bulkId: string) => void;
}

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  original_filename: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  content_category: string | null;
}

const AGENTS = [
  { id: "noah_bennett", label: "Noah Bennett", description: "Social media viral content", icon: "🎯" },
  { id: "emily_carter", label: "Emily Carter", description: "Marketing & conversion", icon: "📈" },
  { id: "ryan_mitchell", label: "Ryan Mitchell", description: "Editorial & education", icon: "📚" },
];

const FORMATS = [
  { id: "reel", label: "Reel", description: "30s vertical video" },
  { id: "story", label: "Story", description: "15s quick impact" },
  { id: "carousel", label: "Carousel", description: "Multi-slide post" },
  { id: "paid_ad", label: "Paid Ad", description: "Meta/TikTok ad copy" },
  { id: "caption", label: "Caption", description: "Post caption + hashtags" },
];

const STYLES = [
  { id: "sabri", label: "Sabri Suby", description: "High-pressure direct response" },
  { id: "dara", label: "Dara Denney", description: "UGC storytelling" },
  { id: "clean", label: "Clean Pro", description: "Polished & professional" },
];

export function BulkVariationGenerator({ 
  open, 
  onClose, 
  preselectedMediaIds = [],
  onComplete 
}: BulkVariationGeneratorProps) {
  const { generateVariations, estimateVariationCount, progress, isGenerating } = useBulkVariations();

  // Form state
  const [brief, setBrief] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["noah_bennett"]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["reel"]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["sabri"]);
  const [countPerCombo, setCountPerCombo] = useState(2);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>(preselectedMediaIds);
  const [selectedInspirationIds, setSelectedInspirationIds] = useState<string[]>([]);
  const [step, setStep] = useState<"config" | "media" | "generating" | "complete">("config");

  // Fetch available media
  const { data: rawMedia = [] } = useQuery({
    queryKey: ["media-library", "raw"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_files")
        .select("*")
        .in("content_category", ["raw", "finished"])
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as MediaFile[];
    },
    enabled: open
  });

  const { data: inspirationMedia = [] } = useQuery({
    queryKey: ["media-library", "inspiration"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_files")
        .select("*")
        .eq("content_category", "inspiration")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as MediaFile[];
    },
    enabled: open
  });

  const estimatedCount = useMemo(() => {
    return estimateVariationCount({
      agents: selectedAgents,
      formats: selectedFormats,
      styles: selectedStyles,
      count_per_combo: countPerCombo
    });
  }, [selectedAgents, selectedFormats, selectedStyles, countPerCombo]);

  const toggleSelection = (
    id: string, 
    current: string[], 
    setter: (val: string[]) => void
  ) => {
    if (current.includes(id)) {
      setter(current.filter(x => x !== id));
    } else {
      setter([...current, id]);
    }
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;

    setStep("generating");

    try {
      const result = await generateVariations.mutateAsync({
        brief,
        source_media_ids: selectedMediaIds,
        inspiration_ids: selectedInspirationIds,
        agents: selectedAgents,
        formats: selectedFormats,
        styles: selectedStyles,
        count_per_combo: countPerCombo
      });

      setStep("complete");
      onComplete?.(result.bulk_id);
    } catch (error) {
      setStep("config");
    }
  };

  const renderMediaThumbnail = (file: MediaFile, selected: boolean, onToggle: () => void) => (
    <div
      key={file.id}
      onClick={onToggle}
      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/50"
      }`}
    >
      <div className="aspect-square bg-muted">
        {file.thumbnail_url || (file.file_type === "image" && file.file_url) ? (
          <img 
            src={file.thumbnail_url || file.file_url} 
            alt={file.original_filename || ""} 
            className="w-full h-full object-cover"
          />
        ) : file.file_type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
        <p className="text-[10px] text-white truncate">{file.original_filename}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Bulk Content Variations
          </DialogTitle>
          <DialogDescription>
            Generate multiple content variations using AI agents
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {step === "config" && (
            <div className="space-y-6 py-4">
              {/* Brief */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Content Brief
                </Label>
                <Textarea
                  placeholder="e.g., 3M Color Flip promo - holiday sale, limited time pricing..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Agents */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  AI Agents
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AGENTS.map(agent => (
                    <Card
                      key={agent.id}
                      onClick={() => toggleSelection(agent.id, selectedAgents, setSelectedAgents)}
                      className={`cursor-pointer transition-all ${
                        selectedAgents.includes(agent.id) 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-primary/50"
                      }`}
                    >
                      <CardContent className="p-3 flex items-start gap-2">
                        <span className="text-xl">{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{agent.label}</p>
                          <p className="text-xs text-muted-foreground">{agent.description}</p>
                        </div>
                        {selectedAgents.includes(agent.id) && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Formats */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Content Formats
                </Label>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map(format => (
                    <Badge
                      key={format.id}
                      variant={selectedFormats.includes(format.id) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => toggleSelection(format.id, selectedFormats, setSelectedFormats)}
                    >
                      {format.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Styles */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Creative Styles
                </Label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(style => (
                    <Badge
                      key={style.id}
                      variant={selectedStyles.includes(style.id) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => toggleSelection(style.id, selectedStyles, setSelectedStyles)}
                    >
                      {style.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Count per combo */}
              <div className="space-y-2">
                <Label>Variations per Combination: {countPerCombo}</Label>
                <Slider
                  value={[countPerCombo]}
                  onValueChange={([val]) => setCountPerCombo(val)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Estimate */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Variations</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAgents.length} agents × {selectedFormats.length} formats × {selectedStyles.length} styles × {countPerCombo}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-primary">{estimatedCount}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "media" && (
            <div className="space-y-6 py-4">
              {/* Source Media */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Source Media (Optional)
                  <Badge variant="secondary" className="ml-auto">{selectedMediaIds.length} selected</Badge>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select raw videos/images for AI to reference when generating scripts
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
                  {rawMedia.map(file => renderMediaThumbnail(
                    file,
                    selectedMediaIds.includes(file.id),
                    () => toggleSelection(file.id, selectedMediaIds, setSelectedMediaIds)
                  ))}
                </div>
                {rawMedia.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No raw media found. Upload some content first!
                  </p>
                )}
              </div>

              {/* Inspiration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Style Inspiration (Optional)
                  <Badge variant="secondary" className="ml-auto">{selectedInspirationIds.length} selected</Badge>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select reference videos to help AI match your preferred style
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
                  {inspirationMedia.map(file => renderMediaThumbnail(
                    file,
                    selectedInspirationIds.includes(file.id),
                    () => toggleSelection(file.id, selectedInspirationIds, setSelectedInspirationIds)
                  ))}
                </div>
                {inspirationMedia.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No inspiration media yet. Upload reference videos you love to help AI learn your style!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <div>
                <p className="text-lg font-medium">Generating {estimatedCount} Variations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This may take a minute...
                </p>
              </div>
              <Progress value={progress} className="w-full max-w-sm mx-auto" />
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {step === "complete" && (
            <div className="py-12 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-medium">Variations Created!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your content variations are now in the Content Queue as drafts
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          {step === "config" && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => setStep("media")}
                disabled={!brief.trim() || selectedAgents.length === 0 || selectedFormats.length === 0 || selectedStyles.length === 0}
              >
                Next: Select Media
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {step === "media" && (
            <>
              <Button variant="outline" onClick={() => setStep("config")}>Back</Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Generate {estimatedCount} Variations
                <Sparkles className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {step === "complete" && (
            <>
              <div />
              <Button onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
