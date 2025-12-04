import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobQRCodeGeneratorProps {
  uploadToken: string;
  jobTitle: string;
}

export function JobQRCodeGenerator({ uploadToken, jobTitle }: JobQRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const uploadUrl = `${window.location.origin}/portfolio/upload/${uploadToken}`;

  useEffect(() => {
    if (uploadToken) {
      QRCode.toDataURL(uploadUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [uploadToken, uploadUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
    
    toast({ title: 'QR Code downloaded' });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    toast({ title: 'Upload link copied' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!uploadToken) {
    return (
      <div className="text-center text-muted-foreground">
        No upload token available
      </div>
    );
  }

  return (
    <Card className="p-6 text-center space-y-4 bg-white">
      <div>
        <h3 className="font-semibold text-foreground">Installer Upload QR</h3>
        <p className="text-sm text-muted-foreground">
          Scan to upload before/after photos
        </p>
      </div>

      {qrDataUrl && (
        <div className="flex justify-center">
          <img src={qrDataUrl} alt="QR Code" className="rounded-lg" />
        </div>
      )}

      <p className="text-xs text-muted-foreground break-all">
        {uploadUrl}
      </p>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
    </Card>
  );
}
