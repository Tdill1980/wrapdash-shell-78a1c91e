import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Instagram, Facebook, Youtube } from 'lucide-react';

interface WizardStepLinksProps {
  data: {
    website_url: string;
    instagram_handle: string;
    facebook_page: string;
    youtube_channel: string;
    tiktok_handle: string;
  };
  onChange: (field: string, value: string) => void;
}

export const WizardStepLinks = ({ data, onChange }: WizardStepLinksProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Globe className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Online Presence</h2>
          <p className="text-sm text-muted-foreground">Where can we find your content?</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website_url" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website URL
          </Label>
          <Input
            id="website_url"
            placeholder="https://weprintwraps.com"
            value={data.website_url}
            onChange={(e) => onChange('website_url', e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram_handle" className="flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Instagram Handle
          </Label>
          <Input
            id="instagram_handle"
            placeholder="@weprintwraps"
            value={data.instagram_handle}
            onChange={(e) => onChange('instagram_handle', e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook_page" className="flex items-center gap-2">
            <Facebook className="w-4 h-4" />
            Facebook Page (optional)
          </Label>
          <Input
            id="facebook_page"
            placeholder="facebook.com/weprintwraps"
            value={data.facebook_page}
            onChange={(e) => onChange('facebook_page', e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube_channel" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            YouTube Channel (optional)
          </Label>
          <Input
            id="youtube_channel"
            placeholder="youtube.com/@weprintwraps"
            value={data.youtube_channel}
            onChange={(e) => onChange('youtube_channel', e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiktok_handle">TikTok Handle (optional)</Label>
          <Input
            id="tiktok_handle"
            placeholder="@weprintwraps"
            value={data.tiktok_handle}
            onChange={(e) => onChange('tiktok_handle', e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>
    </div>
  );
};
