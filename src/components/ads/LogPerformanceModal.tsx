import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaidAdsPerformance, LogPerformanceInput } from "@/hooks/usePaidAdsPerformance";
import { Calculator, DollarSign, MousePointer, Eye, Target, ShoppingCart } from "lucide-react";

interface LogPerformanceModalProps {
  open: boolean;
  onClose: () => void;
  adVaultId?: string;
  contentQueueId?: string;
  adType?: "static" | "video";
  adPreview?: {
    imageUrl?: string;
    headline?: string;
  };
}

export function LogPerformanceModal({
  open,
  onClose,
  adVaultId,
  contentQueueId,
  adType = "static",
  adPreview,
}: LogPerformanceModalProps) {
  const { logPerformance, isLogging } = usePaidAdsPerformance();

  const [form, setForm] = useState({
    impressions: "",
    clicks: "",
    spend: "",
    conversions: "",
    revenue: "",
    platform: "meta",
    placement: "ig_feed",
    campaign_name: "",
  });

  // Calculated metrics
  const impressions = parseInt(form.impressions) || 0;
  const clicks = parseInt(form.clicks) || 0;
  const spend = parseFloat(form.spend) || 0;
  const conversions = parseInt(form.conversions) || 0;
  const revenue = parseFloat(form.revenue) || 0;

  const cpc = clicks > 0 ? spend / clicks : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const costPerConversion = conversions > 0 ? spend / conversions : 0;
  const aov = conversions > 0 ? revenue / conversions : 0;
  const roas = spend > 0 ? revenue / spend : 0;

  const handleSubmit = () => {
    const input: LogPerformanceInput = {
      ad_vault_id: adVaultId,
      content_queue_id: contentQueueId,
      ad_type: adType,
      impressions,
      clicks,
      spend,
      conversions,
      revenue,
      platform: form.platform,
      placement: form.placement,
      campaign_name: form.campaign_name || undefined,
    };

    logPerformance(input, {
      onSuccess: () => {
        setForm({
          impressions: "",
          clicks: "",
          spend: "",
          conversions: "",
          revenue: "",
          platform: "meta",
          placement: "ig_feed",
          campaign_name: "",
        });
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Log Ad Performance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ad Preview */}
          {adPreview?.imageUrl && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <img
                src={adPreview.imageUrl}
                alt="Ad preview"
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <div className="font-medium text-sm">{adPreview.headline || "Ad"}</div>
                <div className="text-xs text-muted-foreground capitalize">{adType} Ad</div>
              </div>
            </div>
          )}

          {/* Platform & Placement */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm({ ...form, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta (FB/IG)</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Placement</Label>
              <Select
                value={form.placement}
                onValueChange={(v) => setForm({ ...form, placement: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ig_feed">IG Feed</SelectItem>
                  <SelectItem value="ig_story">IG Story</SelectItem>
                  <SelectItem value="ig_reels">IG Reels</SelectItem>
                  <SelectItem value="fb_feed">FB Feed</SelectItem>
                  <SelectItem value="fb_story">FB Story</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Core Metrics Input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" /> Impressions
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.impressions}
                onChange={(e) => setForm({ ...form, impressions: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <MousePointer className="w-3 h-3" /> Clicks
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.clicks}
                onChange={(e) => setForm({ ...form, clicks: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Ad Spend ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.spend}
                onChange={(e) => setForm({ ...form, spend: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Target className="w-3 h-3" /> Conversions
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.conversions}
                onChange={(e) => setForm({ ...form, conversions: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" /> Revenue ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
              />
            </div>
          </div>

          {/* Calculated Metrics Display */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Auto-Calculated Metrics
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground">CPC</div>
                <div className="text-sm font-semibold">${cpc.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">CTR</div>
                <div className="text-sm font-semibold">{ctr.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Conv Rate</div>
                <div className="text-sm font-semibold">{conversionRate.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Cost/Conv</div>
                <div className="text-sm font-semibold text-amber-500">${costPerConversion.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">AOV</div>
                <div className="text-sm font-semibold">${aov.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">ROAS</div>
                <div className={`text-sm font-semibold ${roas >= 1 ? "text-green-500" : "text-red-500"}`}>
                  {roas.toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLogging || !form.impressions}
            className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
          >
            {isLogging ? "Saving..." : "Log Performance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
