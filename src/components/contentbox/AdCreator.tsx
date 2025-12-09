import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Megaphone, 
  Zap, 
  TrendingUp,
  Loader2,
  Wand2,
  Instagram,
  Facebook,
  Play
} from "lucide-react";
import { ContentFile } from "@/hooks/useContentBox";

interface AdCreatorProps {
  selectedFiles: ContentFile[];
  onGenerate: (params: Record<string, unknown>) => Promise<void>;
  generating: boolean;
}

const AD_TYPES = [
  { id: 'awareness', name: 'Brand Awareness', icon: <Megaphone className="w-5 h-5" />, description: 'Reach new audiences' },
  { id: 'consideration', name: 'Consideration', icon: <TrendingUp className="w-5 h-5" />, description: 'Drive engagement' },
  { id: 'conversion', name: 'Conversion', icon: <Zap className="w-5 h-5" />, description: 'Generate leads & sales' },
  { id: 'retargeting', name: 'Retargeting', icon: <Target className="w-5 h-5" />, description: 'Re-engage visitors' },
];

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" /> },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5" /> },
  { id: 'tiktok', name: 'TikTok', icon: <Play className="w-5 h-5" /> },
];

const AD_FORMATS = [
  { id: 'video_ad', name: 'Video Ad (15s)', aspect: '9:16' },
  { id: 'carousel', name: 'Carousel', aspect: '1:1' },
  { id: 'story_ad', name: 'Story Ad', aspect: '9:16' },
  { id: 'feed_ad', name: 'Feed Ad', aspect: '4:5' },
];

export function AdCreator({ selectedFiles, onGenerate, generating }: AdCreatorProps) {
  const [adType, setAdType] = useState<string>('conversion');
  const [platform, setPlatform] = useState<string>('instagram');
  const [format, setFormat] = useState<string>('video_ad');
  const [headline, setHeadline] = useState('');
  const [cta, setCta] = useState('Shop Now');

  if (selectedFiles.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">Select Content for Ads</h3>
        <p className="text-muted-foreground text-sm">
          Choose images or videos from your library to create ad variations
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Media Preview */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {selectedFiles.map((file) => (
          <div key={file.id} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
            <img 
              src={file.thumbnail_url || file.file_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <Badge className="absolute bottom-1 left-1 text-[10px] bg-black/60">
              {file.brand.toUpperCase()}
            </Badge>
          </div>
        ))}
      </div>

      {/* Ad Objective */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ad Objective</CardTitle>
          <CardDescription className="text-xs">What's your goal?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {AD_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setAdType(type.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  adType === type.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={adType === type.id ? 'text-primary' : 'text-muted-foreground'}>
                    {type.icon}
                  </span>
                  <span className="font-medium text-sm text-foreground">{type.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  platform === p.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {p.icon}
                <span className="text-sm font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ad Format */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ad Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {AD_FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  format === f.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-sm text-foreground">{f.name}</span>
                <Badge variant="secondary" className="ml-2 text-[10px]">{f.aspect}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ad Copy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ad Copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Headline (AI will generate if empty)</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Transform Your Ride Today"
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Call to Action</label>
            <select
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="w-full mt-1 bg-muted text-foreground p-2 rounded-md border border-border text-sm"
            >
              <option>Shop Now</option>
              <option>Learn More</option>
              <option>Get Quote</option>
              <option>Book Now</option>
              <option>Contact Us</option>
              <option>Sign Up</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
        size="lg"
        disabled={generating}
        onClick={() => onGenerate({
          ad_type: adType,
          platform,
          format,
          headline: headline || undefined,
          cta,
          media_urls: selectedFiles.map(f => f.file_url),
        })}
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Generating Ads...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2" />
            Generate Ad Variations
          </>
        )}
      </Button>
    </div>
  );
}
