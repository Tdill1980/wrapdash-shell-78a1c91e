import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  affiliateCode: string;
  cardUrl: string;
}

export const QRCodeGenerator = ({ affiliateCode, cardUrl }: QRCodeGeneratorProps) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardUrl)}`;

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `affiliate-qr-${affiliateCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
      <h3 className="text-lg font-semibold text-white mb-4">QR Code</h3>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg">
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="w-48 h-48"
          />
        </div>
        
        <p className="text-sm text-[#B8B8C7] text-center">
          Scan to visit your business card
        </p>
        
        <Button 
          onClick={downloadQRCode}
          className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      </div>
    </Card>
  );
};