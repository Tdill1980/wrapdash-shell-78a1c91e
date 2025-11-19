import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, QrCode, Share2, ExternalLink, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';

interface ProductCardProps {
  productName: string;
  description: string;
  tagline: string;
  commissionRate: number;
  baseUrl: string;
  affiliateCode: string;
  icon: string;
  totalEarned: number;
  totalReferrals: number;
  color: string;
}

export const ProductCard = ({
  productName,
  description,
  tagline,
  commissionRate,
  baseUrl,
  affiliateCode,
  icon,
  totalEarned,
  totalReferrals,
  color,
}: ProductCardProps) => {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>('');
  const [utmParams, setUtmParams] = useState({
    source: '',
    medium: 'affiliate',
    campaign: '',
  });

  const affiliateLink = `${baseUrl}/?ref=${affiliateCode}`;
  
  const generateUTMLink = () => {
    const params = new URLSearchParams({
      ref: affiliateCode,
      utm_source: utmParams.source || 'affiliate',
      utm_medium: utmParams.medium,
      utm_campaign: utmParams.campaign || productName.toLowerCase().replace(/\s/g, '-'),
    });
    return `${baseUrl}/?${params.toString()}`;
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied!',
      description: 'Affiliate link copied to clipboard',
    });
  };

  const generateQRCode = async () => {
    try {
      const qr = await QRCodeLib.toDataURL(affiliateLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCode(qr);
    } catch (error) {
      console.error('QR code generation error:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${productName.replace(/\s/g, '-')}-QR.png`;
    link.click();
  };

  return (
    <Card className={`p-6 bg-card border-border hover:border-primary/50 transition-all group`}>
      {/* Product Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{icon}</div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{productName}</h3>
            <p className="text-xs text-muted-foreground italic">{tagline}</p>
          </div>
        </div>
        <Badge className={`bg-gradient-to-r ${color}`}>
          {commissionRate}%
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
          <p className={`text-xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            ${totalEarned.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Referrals</p>
          <p className="text-xl font-bold text-white flex items-center gap-1">
            {totalReferrals}
            <TrendingUp className="w-4 h-4 text-primary" />
          </p>
        </div>
      </div>

      {/* Affiliate Link */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1">Your Affiliate Link</Label>
        <div className="flex gap-2">
          <Input
            value={affiliateLink}
            readOnly
            className="bg-background border-border text-xs font-mono"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyLink(affiliateLink)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => copyLink(affiliateLink)}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={generateQRCode}
            >
              <QrCode className="w-3 h-3 mr-1" />
              QR
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{productName} QR Code</DialogTitle>
            </DialogHeader>
            {qrCode && (
              <div className="space-y-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <Button onClick={downloadQRCode} className="w-full">
                  Download QR Code
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full">
              <Share2 className="w-3 h-3 mr-1" />
              UTM
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Generate UTM Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Source</Label>
                <Input
                  value={utmParams.source}
                  onChange={(e) => setUtmParams({ ...utmParams, source: e.target.value })}
                  placeholder="instagram, facebook, email..."
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label>Medium</Label>
                <Input
                  value={utmParams.medium}
                  onChange={(e) => setUtmParams({ ...utmParams, medium: e.target.value })}
                  placeholder="social, email, cpc..."
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label>Campaign</Label>
                <Input
                  value={utmParams.campaign}
                  onChange={(e) => setUtmParams({ ...utmParams, campaign: e.target.value })}
                  placeholder="spring-sale, launch..."
                  className="bg-background border-border"
                />
              </div>
              <div className="p-3 bg-background rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Generated Link:</p>
                <p className="text-xs font-mono break-all text-white">{generateUTMLink()}</p>
              </div>
              <Button
                onClick={() => copyLink(generateUTMLink())}
                className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF]"
              >
                Copy UTM Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visit Product */}
      <a
        href={baseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 text-xs text-primary hover:underline"
      >
        Visit {productName} <ExternalLink className="w-3 h-3" />
      </a>
    </Card>
  );
};
