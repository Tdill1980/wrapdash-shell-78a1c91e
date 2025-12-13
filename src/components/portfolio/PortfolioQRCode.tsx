import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";
import QRCode from "qrcode";
import { QrCode, Download, Copy, ExternalLink } from "lucide-react";

export function PortfolioQRCode() {
  const { organizationSettings } = useOrganization();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const portfolioUrl = organizationSettings?.subdomain
    ? `https://wrapcommandai.com/gallery/${organizationSettings.subdomain}`
    : "";

  useEffect(() => {
    const generateQR = async () => {
      if (!portfolioUrl) return;

      try {
        const dataUrl = await QRCode.toDataURL(portfolioUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("QR generation error:", err);
      }
    };

    generateQR();
  }, [portfolioUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `portfolio-qr-${organizationSettings?.subdomain || "shop"}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR code downloaded!");
  };

  const handleCopy = async () => {
    if (!portfolioUrl) return;

    try {
      await navigator.clipboard.writeText(portfolioUrl);
      toast.success("URL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="w-5 h-5 text-primary" />
          Portfolio QR Code
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          {qrDataUrl ? (
            <div className="p-4 bg-white rounded-lg">
              <img
                src={qrDataUrl}
                alt="Portfolio QR Code"
                className="w-48 h-48"
              />
            </div>
          ) : (
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Public Gallery URL</label>
          <div className="flex gap-2">
            <Input
              value={portfolioUrl || "Set up your subdomain first"}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!portfolioUrl}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(portfolioUrl, "_blank")}
              disabled={!portfolioUrl}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <Button
          className="w-full"
          onClick={handleDownload}
          disabled={!qrDataUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Print this QR code and display it in your shop. Customers can scan to
          view your portfolio on their phones.
        </p>
      </CardContent>
    </Card>
  );
}
