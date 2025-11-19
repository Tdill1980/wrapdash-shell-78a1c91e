import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UTMLinkGeneratorProps {
  affiliateCode: string;
}

export const UTMLinkGenerator = ({ affiliateCode }: UTMLinkGeneratorProps) => {
  const [baseUrl, setBaseUrl] = useState('https://weprintwraps.com');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateLink = () => {
    const params = new URLSearchParams({
      ref: affiliateCode,
      utm_source: 'affiliate',
      utm_medium: 'referral',
      utm_campaign: campaign || 'general',
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateLink());
    setCopied(true);
    toast({
      title: 'Link Copied',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
      <h3 className="text-lg font-semibold text-white mb-4">UTM Link Generator</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="baseUrl" className="text-[#B8B8C7]">Base URL</Label>
          <Input
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="campaign" className="text-[#B8B8C7]">Campaign Name (optional)</Label>
          <Input
            id="campaign"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="e.g., summer-promo"
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
          />
        </div>
        
        <div className="bg-[#0A0A0F] p-4 rounded-lg border border-[#ffffff0f]">
          <Label className="text-[#B8B8C7] mb-2 block">Generated Link</Label>
          <p className="text-sm text-white break-all font-mono">{generateLink()}</p>
        </div>
        
        <Button 
          onClick={copyToClipboard}
          className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};