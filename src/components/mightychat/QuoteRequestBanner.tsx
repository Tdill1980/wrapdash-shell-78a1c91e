import { AlertCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface QuoteRequestBannerProps {
  messageType?: string;
  priority?: string;
  extractedData?: {
    vehicle?: string;
    service?: string;
    deadline?: string;
  };
  contactEmail?: string;
  contactName?: string;
}

export function QuoteRequestBanner({ 
  messageType, 
  priority, 
  extractedData,
  contactEmail,
  contactName
}: QuoteRequestBannerProps) {
  const navigate = useNavigate();

  if (messageType !== 'quote_request') return null;

  const handleCreateQuote = () => {
    // Navigate to MightyCustomer with pre-filled data
    navigate('/mightycustomer', {
      state: {
        customerName: contactName || '',
        customerEmail: contactEmail || '',
        vehicleDetails: extractedData?.vehicle || '',
        serviceType: extractedData?.service || '',
        notes: extractedData?.deadline ? `Deadline: ${extractedData.deadline}` : '',
      }
    });
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Quote Request Detected</span>
              {priority === 'urgent' && (
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              )}
              {priority === 'high' && (
                <Badge className="text-xs bg-orange-500">High Priority</Badge>
              )}
            </div>
            {extractedData && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {extractedData.vehicle && <p>🚗 Vehicle: {extractedData.vehicle}</p>}
                {extractedData.service && <p>🔧 Service: {extractedData.service}</p>}
                {extractedData.deadline && <p>📅 Deadline: {extractedData.deadline}</p>}
              </div>
            )}
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={handleCreateQuote}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
        >
          <span>Create Quote</span>
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
