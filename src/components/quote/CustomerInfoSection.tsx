import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building2, Search, CheckCircle, Loader2 } from "lucide-react";
import { useContactLookup, ContactData } from "@/hooks/useContactLookup";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

interface CustomerData {
  name: string;
  company: string;
  phone: string;
  email: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
}

interface CustomerInfoSectionProps {
  customerData: CustomerData;
  onCustomerDataChange: (data: Partial<CustomerData>) => void;
  onContactFound?: (contact: ContactData) => void;
  compact?: boolean;
}

export function CustomerInfoSection({
  customerData,
  onCustomerDataChange,
  onContactFound,
  compact = false,
}: CustomerInfoSectionProps) {
  const { lookupContact, foundContact, isLooking, clearContact } = useContactLookup();
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Debounced lookup on field blur
  const debouncedLookup = useDebouncedCallback(async (field: string, value: string) => {
    if (hasAutoFilled) return; // Don't lookup again if we already autofilled
    
    const query = {
      email: field === "email" ? value : customerData.email,
      phone: field === "phone" ? value : customerData.phone,
      company: field === "company" ? value : customerData.company,
    };
    
    const contact = await lookupContact(query);
    if (contact) {
      setHasAutoFilled(true);
      onCustomerDataChange({
        name: contact.name || customerData.name,
        email: contact.email || customerData.email,
        phone: contact.phone || customerData.phone,
        company: contact.company || customerData.company,
      });
      onContactFound?.(contact);
    }
  }, 500);

  const handleBlur = (field: string, value: string) => {
    if (value.trim() && !hasAutoFilled) {
      debouncedLookup(field, value);
    }
  };

  // Reset autofill state when all fields are cleared
  useEffect(() => {
    if (!customerData.name && !customerData.email && !customerData.phone && !customerData.company) {
      setHasAutoFilled(false);
      clearContact();
    }
  }, [customerData, clearContact]);

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Input
            placeholder="Customer Name"
            value={customerData.name}
            onChange={(e) => onCustomerDataChange({ name: e.target.value })}
            onBlur={(e) => handleBlur("name", e.target.value)}
            className="pl-9"
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="relative">
          <Input
            placeholder="Email"
            type="email"
            value={customerData.email}
            onChange={(e) => onCustomerDataChange({ email: e.target.value })}
            onBlur={(e) => handleBlur("email", e.target.value)}
            className="pl-9"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {isLooking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
        </div>
        <div className="relative">
          <Input
            placeholder="Phone"
            type="tel"
            value={customerData.phone}
            onChange={(e) => onCustomerDataChange({ phone: e.target.value })}
            onBlur={(e) => handleBlur("phone", e.target.value)}
            className="pl-9"
          />
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="relative">
          <Input
            placeholder="Shop / Company"
            value={customerData.company}
            onChange={(e) => onCustomerDataChange({ company: e.target.value })}
            onBlur={(e) => handleBlur("company", e.target.value)}
            className="pl-9"
          />
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Customer Information</Label>
        {foundContact && (
          <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3" />
            Existing Customer
          </Badge>
        )}
        {isLooking && (
          <Badge variant="secondary" className="gap-1">
            <Search className="h-3 w-3 animate-pulse" />
            Looking up...
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Customer Name *</Label>
          <div className="relative">
            <Input
              id="customer-name"
              placeholder="John Smith"
              value={customerData.name}
              onChange={(e) => onCustomerDataChange({ name: e.target.value })}
              onBlur={(e) => handleBlur("name", e.target.value)}
              className="pl-9"
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email *</Label>
          <div className="relative">
            <Input
              id="customer-email"
              type="email"
              placeholder="john@example.com"
              value={customerData.email}
              onChange={(e) => onCustomerDataChange({ email: e.target.value })}
              onBlur={(e) => handleBlur("email", e.target.value)}
              className="pl-9"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isLooking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Phone *</Label>
          <div className="relative">
            <Input
              id="customer-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={customerData.phone}
              onChange={(e) => onCustomerDataChange({ phone: e.target.value })}
              onBlur={(e) => handleBlur("phone", e.target.value)}
              className="pl-9"
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-company">Shop / Company Name *</Label>
          <div className="relative">
            <Input
              id="customer-company"
              placeholder="ABC Wraps LLC"
              value={customerData.company}
              onChange={(e) => onCustomerDataChange({ company: e.target.value })}
              onBlur={(e) => handleBlur("company", e.target.value)}
              className="pl-9"
            />
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {foundContact?.last_quote_at && (
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground">
            Last quote: <span className="text-foreground font-medium">
              ${foundContact.last_quote_amount?.toFixed(2) || "N/A"}
            </span> on {new Date(foundContact.last_quote_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
