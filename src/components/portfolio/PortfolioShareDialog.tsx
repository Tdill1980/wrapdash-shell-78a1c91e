import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Copy, Mail, QrCode, Download, ExternalLink } from "lucide-react";

interface PortfolioShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PortfolioShareDialog({
  open,
  onOpenChange,
}: PortfolioShareDialogProps) {
  const { organizationSettings } = useOrganization();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [email, setEmail] = useState("");

  // Generate portfolio URL based on organization subdomain
  const portfolioUrl = organizationSettings?.subdomain
    ? `${window.location.origin}/gallery/${organizationSettings.subdomain}`
    : `${window.location.origin}/portfolio`;

  // Generate QR code when dialog opens
  useEffect(() => {
    if (open) {
      QRCode.toDataURL(portfolioUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }).then(setQrCodeUrl);
    }
  }, [open, portfolioUrl]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(portfolioUrl);
    toast.success("Link copied to clipboard!");
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.download = `portfolio-qr-${organizationSettings?.subdomain || "gallery"}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success("QR code downloaded!");
  };

  const sendEmail = () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    const subject = encodeURIComponent(
      `Check out our portfolio - ${organizationSettings?.name || "Our Wrap Shop"}`
    );
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to share our portfolio of wrap projects with you:\n\n${portfolioUrl}\n\nTake a look at some of our best work!\n\nBest regards,\n${organizationSettings?.name || "The Team"}`
    );

    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    toast.success("Email client opened!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Share Portfolio
          </DialogTitle>
          <DialogDescription>
            Share your portfolio gallery with customers via link, QR code, or email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            {qrCodeUrl && (
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <img src={qrCodeUrl} alt="Portfolio QR Code" className="w-48 h-48" />
              </div>
            )}
            <Button variant="outline" onClick={downloadQR}>
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label>Portfolio Link</Label>
            <div className="flex gap-2">
              <Input value={portfolioUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(portfolioUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Send via Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="customer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={sendEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
