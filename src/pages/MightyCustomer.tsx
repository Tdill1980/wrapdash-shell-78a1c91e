import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceCommand from "@/components/VoiceCommand";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  Grid3x3,
  Shield,
  Sun,
  Package,
  Car,
  Plus,
  Send,
} from "lucide-react";

const serviceTypes = [
  { id: "full-wraps", name: "Full Wraps", icon: Car },
  { id: "partial-wraps", name: "Partial Wraps", icon: Palette },
  { id: "chrome-delete", name: "Chrome Delete", icon: Grid3x3 },
  { id: "ppf", name: "PPF", icon: Shield },
  { id: "window-tint", name: "Window Tint", icon: Sun },
  { id: "all-products", name: "All Products", icon: Package },
];

const productsByService = {
  "full-wraps": [
    "Avery Dennison SW900 (Gloss)",
    "Avery Dennison SW900 (Satin)",
    "Avery Dennison SW900 (Matte)",
    "3M 2080 (Gloss)",
    "3M 2080 (Satin)",
    "3M 2080 (Matte)",
    "Arlon 6100X RP",
    "Printable Wrap - WPW Printed Vinyl (Gloss)",
    "Printable Wrap - WPW Printed Vinyl (Satin)",
    "Printable Wrap - WPW Printed Vinyl (Matte)",
    "InkFusion Printed PPF (Gloss PPF)",
    "InkFusion Printed PPF (Matte PPF)",
  ],
  "partial-wraps": [
    "Hood Only",
    "Roof Only",
    "Pillars",
    "Chrome Delete",
    "Accent Panels (Custom SQFT)",
  ],
  "chrome-delete": [
    "Chrome Delete - Full Vehicle",
    "Chrome Delete - Window Trim",
    "Chrome Delete - Door Handles",
    "Chrome Delete - Custom Areas",
  ],
  "ppf": [
    "STEK (Gloss)",
    "STEK (Matte)",
    "GSWF (Gloss)",
    "GSWF (Matte)",
    "GSWF (Color PPF)",
    "SunTek (Gloss)",
    "SunTek (Matte)",
    "XPEL (Gloss)",
    "XPEL (Matte)",
    "Avery PPF (Gloss)",
    "Avery PPF (Matte)",
    "WPW InkFusion Printable PPF (Gloss)",
    "WPW InkFusion Printable PPF (Matte)",
  ],
  "window-tint": [
    "Carbon Tint",
    "Ceramic Tint",
    "IR Ceramic Tint",
    "Windshield Only",
    "Front 2 Windows",
    "Full SUV Tint",
    "5% Limo",
    "20% Dark",
    "35% Medium",
    "50% Light",
  ],
  "all-products": [
    // Full Wraps
    "Avery Dennison SW900 (Gloss)",
    "Avery Dennison SW900 (Satin)",
    "Avery Dennison SW900 (Matte)",
    "3M 2080 (Gloss)",
    "3M 2080 (Satin)",
    "3M 2080 (Matte)",
    "Arlon 6100X RP",
    "Printable Wrap - WPW Printed Vinyl (Gloss)",
    "Printable Wrap - WPW Printed Vinyl (Satin)",
    "Printable Wrap - WPW Printed Vinyl (Matte)",
    "InkFusion Printed PPF (Gloss PPF)",
    "InkFusion Printed PPF (Matte PPF)",
    // Partial Wraps
    "Hood Only",
    "Roof Only",
    "Pillars",
    "Chrome Delete",
    "Accent Panels (Custom SQFT)",
    // PPF
    "STEK (Gloss)",
    "STEK (Matte)",
    "GSWF (Gloss)",
    "GSWF (Matte)",
    "GSWF (Color PPF)",
    "SunTek (Gloss)",
    "SunTek (Matte)",
    "XPEL (Gloss)",
    "XPEL (Matte)",
    "Avery PPF (Gloss)",
    "Avery PPF (Matte)",
    "WPW InkFusion Printable PPF (Gloss)",
    "WPW InkFusion Printable PPF (Matte)",
    // Window Tint
    "Carbon Tint",
    "Ceramic Tint",
    "IR Ceramic Tint",
    "Windshield Only",
    "Front 2 Windows",
    "Full SUV Tint",
    "5% Limo",
    "20% Dark",
    "35% Medium",
    "50% Light",
    // Chrome Delete
    "Chrome Delete - Full Vehicle",
    "Chrome Delete - Window Trim",
    "Chrome Delete - Door Handles",
    "Chrome Delete - Custom Areas",
  ],
};

const addOnOptions = [
  "PPF Hood Only",
  "Roof Wrap",
  "Window Perf Rear",
  "Chrome Delete",
  "Tint Front Windows",
  "Design Service",
  "Pre-Install Wash",
  "Installation",
  "Custom Add-On",
];

export default function MightyCustomer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [customerData, setCustomerData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    year: "",
    make: "",
    model: "",
    vehicleType: "",
  });
  const [margin, setMargin] = useState(40);
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState("Gloss");
  const [sending, setSending] = useState(false);

  const handleVoiceTranscript = (_transcript: string, parsedData: any) => {
    setCustomerData({
      name: parsedData.customerName || customerData.name,
      company: parsedData.companyName || customerData.company,
      phone: parsedData.phone || customerData.phone,
      email: parsedData.email || customerData.email,
      year: parsedData.year || customerData.year,
      make: parsedData.make || customerData.make,
      model: parsedData.model || customerData.model,
      vehicleType: customerData.vehicleType,
    });

    if (parsedData.serviceType) {
      const serviceId = serviceTypes.find(s => 
        s.name.toLowerCase() === parsedData.serviceType.toLowerCase()
      )?.id;
      if (serviceId) setSelectedService(serviceId);
    }

    if (parsedData.productType) {
      setSelectedProduct(parsedData.productType);
    }

    if (parsedData.addOns && parsedData.addOns.length > 0) {
      setSelectedAddOns(parsedData.addOns);
    }
  };

  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOn)
        ? prev.filter(a => a !== addOn)
        : [...prev, addOn]
    );
  };

  const handleSendToApproveFlow = async () => {
    if (!customerData.name || !selectedService) {
      toast({
        title: "Missing information",
        description: "Please fill in customer name and select a service type",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const orderNumber = `MQ-${Date.now()}`;
      const productType = selectedProduct || serviceTypes.find(s => s.id === selectedService)?.name || 'Custom Wrap';
      
      // Calculate order total (basic calculation)
      const basePrice = 2500;
      const addOnPrice = selectedAddOns.length * 250;
      const orderTotal = (basePrice + addOnPrice) * (1 + margin / 100);

      // Create ApproveFlow project
      const { data: newProject, error } = await supabase
        .from('approveflow_projects')
        .insert({
          order_number: orderNumber,
          customer_name: customerData.name,
          customer_email: customerData.email,
          product_type: productType,
          design_instructions: `Vehicle: ${customerData.year} ${customerData.make} ${customerData.model}\nService: ${productType}\nAdd-ons: ${selectedAddOns.join(', ')}\nFinish: ${finish}\nQuantity: ${quantity}`,
          order_total: orderTotal,
          status: 'design_requested',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sent to ApproveFlow",
        description: `Project ${orderNumber} created successfully`,
      });

      navigate(`/approveflow/${newProject.id}`);
    } catch (error) {
      console.error('Error creating ApproveFlow project:', error);
      toast({
        title: "Failed to send",
        description: "Unable to create ApproveFlow project",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#121218] to-[#16161E]">
      <VoiceCommand onTranscript={handleVoiceTranscript} />

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight font-poppins">
            <span className="text-foreground">Mighty</span>
            <span className="text-gradient">Customer</span>
            <span className="text-muted-foreground text-sm align-super">™</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quote & Order Builder
          </p>
        </div>

        <Card className="bg-[#121218]/90 border-border/40 backdrop-blur-sm rounded-md">
          <div className="p-5 space-y-5">
            {/* Category Menu - Horizontal Scroll */}
            <div className="relative">
              <Label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wide">
                Product Categories
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {serviceTypes.map((service) => (
                  <Button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service.id);
                      setSelectedProduct("");
                    }}
                    className={`whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium transition-all ${
                      selectedService === service.id
                        ? "bg-gradient-primary text-white shadow-[0_0_16px_rgba(0,175,255,0.3)]"
                        : "bg-[#16161E] text-foreground border border-border/40 hover:border-primary/60 hover:bg-[#1A1A24]"
                    }`}
                  >
                    {service.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            {selectedService && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Select Product
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {productsByService[selectedService as keyof typeof productsByService]?.map((product) => (
                    <button
                      key={product}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-3 rounded-md text-left text-sm transition-all ${
                        selectedProduct === product
                          ? "bg-gradient-primary text-white shadow-[0_0_12px_rgba(0,175,255,0.2)]"
                          : "bg-[#16161E] text-foreground border border-border/40 hover:border-primary/40 hover:bg-[#1A1A24]"
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Year
                </Label>
                <Input
                  placeholder="2024"
                  value={customerData.year}
                  onChange={(e) => setCustomerData({ ...customerData, year: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Make
                </Label>
                <Input
                  placeholder="Tesla"
                  value={customerData.make}
                  onChange={(e) => setCustomerData({ ...customerData, make: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Model
                </Label>
                <Input
                  placeholder="Model 3"
                  value={customerData.model}
                  onChange={(e) => setCustomerData({ ...customerData, model: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
            </div>

            {/* Quantity, Finish */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Quantity
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Finish
                </Label>
                <select
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full p-3 rounded-md bg-[#0F0F14] border border-border/40 text-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  <option value="Gloss">Gloss</option>
                  <option value="Satin">Satin</option>
                  <option value="Matte">Matte</option>
                </select>
              </div>
            </div>

            {/* Add-Ons */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                Add-Ons
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {addOnOptions.map((addOn) => (
                  <button
                    key={addOn}
                    onClick={() => toggleAddOn(addOn)}
                    className={`p-2.5 rounded-md text-xs transition-all ${
                      selectedAddOns.includes(addOn)
                        ? "bg-gradient-primary text-white shadow-[0_0_8px_rgba(0,175,255,0.2)]"
                        : "bg-[#16161E] text-foreground border border-border/40 hover:border-primary/40"
                    }`}
                  >
                    {addOn}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Slider */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                Margin: {margin}%
              </Label>
              <input
                type="range"
                min="0"
                max="100"
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value))}
                className="w-full h-2 bg-[#16161E] rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Customer Name
                </Label>
                <Input
                  placeholder="John Smith"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Company
                </Label>
                <Input
                  placeholder="Company Name"
                  value={customerData.company}
                  onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Phone
                </Label>
                <Input
                  placeholder="(555) 123-4567"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="bg-[#0F0F14] border-border/40 focus:border-primary/60"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-primary/40 hover:bg-primary/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Quote
              </Button>
              <Button
                onClick={handleSendToApproveFlow}
                disabled={sending}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send to ApproveFlow"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
