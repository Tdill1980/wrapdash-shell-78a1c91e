import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Check, DollarSign, Loader2 } from "lucide-react";
import { AnalysisResult, DetectedService } from "@/pages/BetaSignup";

interface DetectedServicesStepProps {
  analysisResult: AnalysisResult;
  onServiceToggle: (index: number) => void;
  onServiceUpdate: (index: number, field: string, value: any) => void;
  onAddService: () => void;
  onActivate: () => void;
  isLoading: boolean;
}

const CATEGORIES = [
  { value: "wraps", label: "Vehicle Wraps" },
  { value: "ppf", label: "Paint Protection Film" },
  { value: "tint", label: "Window Tint" },
  { value: "ceramic", label: "Ceramic Coating" },
  { value: "design", label: "Design Services" },
  { value: "commercial", label: "Commercial Wraps" },
  { value: "other", label: "Other" },
];

const ConfidenceBadge = ({ confidence }: { confidence: string }) => {
  const colors = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-muted text-muted-foreground border-muted-foreground/30",
  };

  return (
    <Badge variant="outline" className={`text-xs ${colors[confidence as keyof typeof colors]}`}>
      {confidence === "high" ? "AI Confident" : confidence === "medium" ? "Detected" : "Manual"}
    </Badge>
  );
};

export const DetectedServicesStep = ({
  analysisResult,
  onServiceToggle,
  onServiceUpdate,
  onAddService,
  onActivate,
  isLoading,
}: DetectedServicesStepProps) => {
  const enabledCount = analysisResult.detectedServices.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">
            Look what we found! Your services are ready 💰
          </span>
        </div>
      </div>

      {/* Brand Voice Summary (Collapsed) */}
      <div className="p-4 rounded-xl bg-card/50 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Brand Voice: {analysisResult.voiceProfile?.tone}</p>
            <p className="text-xs text-muted-foreground">
              {analysisResult.voiceProfile?.persona} • {analysisResult.voiceProfile?.energy} Energy
            </p>
          </div>
          <Check className="w-5 h-5 text-green-400" />
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Detected Services</h3>
          <Badge variant="outline" className="text-primary border-primary/30">
            {enabledCount} active
          </Badge>
        </div>

        <div className="space-y-3">
          {analysisResult.detectedServices.map((service, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-xl border transition-all duration-300
                ${service.enabled
                  ? "bg-card/50 backdrop-blur-xl border-white/10"
                  : "bg-muted/30 border-muted/20 opacity-60"
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Toggle */}
                <Switch
                  checked={service.enabled}
                  onCheckedChange={() => onServiceToggle(index)}
                  className="mt-1"
                />

                {/* Service Details */}
                <div className="flex-1 space-y-3">
                  {/* Name and Confidence */}
                  <div className="flex items-center gap-3">
                    <Input
                      value={service.name}
                      onChange={(e) => onServiceUpdate(index, "name", e.target.value)}
                      className="flex-1 bg-background/50 border-white/10 font-medium"
                      disabled={!service.enabled}
                    />
                    <ConfidenceBadge confidence={service.confidence} />
                  </div>

                  {/* Category and Pricing */}
                  <div className="grid grid-cols-3 gap-3">
                    <Select
                      value={service.category}
                      onValueChange={(value) => onServiceUpdate(index, "category", value)}
                      disabled={!service.enabled}
                    >
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={service.pricing_type}
                      onValueChange={(value) => onServiceUpdate(index, "pricing_type", value)}
                      disabled={!service.enabled}
                    >
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                        <SelectItem value="flat">Flat Rate</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={service.suggested_price}
                        onChange={(e) => onServiceUpdate(index, "suggested_price", parseFloat(e.target.value) || 0)}
                        className="pl-8 bg-background/50 border-white/10"
                        disabled={!service.enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Service Button */}
        <Button
          variant="outline"
          onClick={onAddService}
          className="w-full border-dashed border-white/20 text-muted-foreground hover:text-foreground hover:border-primary/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Service
        </Button>
      </div>

      {/* Activate Button */}
      <Button
        onClick={onActivate}
        disabled={isLoading || enabledCount === 0}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-500/90 hover:to-emerald-400/90 transition-all duration-300 shadow-lg shadow-green-500/25"
        style={{
          boxShadow: "0 0 30px hsl(142, 76%, 36% / 0.3)",
        }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Check className="w-5 h-5 mr-2" />
        )}
        Activate My Shop
      </Button>
    </div>
  );
};
