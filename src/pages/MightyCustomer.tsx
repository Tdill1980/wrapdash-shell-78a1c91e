import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceCommand from "@/components/VoiceCommand";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileImage,
  Palette,
  Grid3x3,
  Shield,
  Sun,
  Wallpaper,
  Package,
  Car,
  Plus,
  Send,
} from "lucide-react";

const serviceTypes = [
  { id: "printed-vinyl", name: "Printed Vinyl", icon: FileImage },
  { id: "color-change", name: "Color Change", icon: Palette },
  { id: "window-perf", name: "Window Perf", icon: Grid3x3 },
  { id: "ppf", name: "PPF", icon: Shield },
  { id: "tint", name: "Tint", icon: Sun },
  { id: "wall-wrap", name: "Wall Wrap", icon: Wallpaper },
  { id: "wpw-products", name: "WPW Products", icon: Package },
];

const productsByService = {
  "printed-vinyl": [
    "WPW Printed Wrap (Avery)",
    "WPW Printed Wrap (3M)",
    "Fade Wraps™",
    "Pattern Wraps",
    "Metallic Print",
    "Clear Wrap Film",
    "Reflective Print",
    "Cut Contour (Avery)",
    "Cut Contour (3M)",
  ],
  "color-change": [
    "Avery SW900",
    "3M 2080",
    "KPMF",
    "APA",
  ],
  "ppf": [
    "Gloss PPF",
    "Matte PPF",
    "Smoked PPF",
  ],
  "window-perf": [
    "70/30 Perf",
    "60/40 Perf",
    "WPW Perf Options",
  ],
  "tint": [
    "Ceramic Tint",
    "IR Tint",
    "Dyed Tint",
    "5% Limo",
    "20% Dark",
    "35% Medium",
    "50% Light",
  ],
  "wall-wrap": [
    "Cast Wall Wrap",
    "Calendared Vinyl",
    "Textured Wall Vinyl",
  ],
  "wpw-products": [
    "WPW Catalog Item",
    "Custom WPW Product",
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
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">Mighty</span>
            <span className="text-primary">Customer</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quote & Order Builder
          </p>
        </div>

        <Card className="bg-[#121218]/90 border-border/40 backdrop-blur-sm rounded-md">
          <div className="p-5 space-y-5">
            {/* Service Type Selection */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                Service Type
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {serviceTypes.map((service) => {
                  const Icon = service.icon;
                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service.id);
                        setSelectedProduct("");
                      }}
                      className={`p-3 rounded-md border transition-all duration-200 ${
                        selectedService === service.id
                          ? "bg-[#1A1A24] border-primary/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                          : "bg-[#0F0F14] border-border/40 hover:border-primary/40 hover:bg-[#141419]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mx-auto mb-1.5 ${
                        selectedService === service.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className={`text-[10px] font-medium block ${
                        selectedService === service.id ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {service.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Selection */}
            {selectedService && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Product
                </Label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-[#0F0F14] border border-border/40 rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option value="">Choose a Product</option>
                  {productsByService[selectedService as keyof typeof productsByService]?.map(
                    (product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* Vehicle Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Year
                </Label>
                <Input
                  value={customerData.year}
                  onChange={(e) => setCustomerData({ ...customerData, year: e.target.value })}
                  placeholder="2024"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Make
                </Label>
                <Input
                  value={customerData.make}
                  onChange={(e) => setCustomerData({ ...customerData, make: e.target.value })}
                  placeholder="Chevrolet"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Model
                </Label>
                <Input
                  value={customerData.model}
                  onChange={(e) => setCustomerData({ ...customerData, model: e.target.value })}
                  placeholder="Tahoe"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
              </div>
            </div>

            {/* Quantity & Finish */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Quantity
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Finish
                </Label>
                <select
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full bg-[#0F0F14] border border-border/40 rounded-md px-3 py-2 text-sm text-foreground h-9 focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option>Gloss</option>
                  <option>Matte</option>
                  <option>Satin</option>
                </select>
              </div>
            </div>

            {/* Add-Ons */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                Add-Ons
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {addOnOptions.map((addOn) => (
                  <button
                    key={addOn}
                    onClick={() => toggleAddOn(addOn)}
                    className={`px-2.5 py-1.5 rounded-md border transition-all duration-200 text-[11px] ${
                      selectedAddOns.includes(addOn)
                        ? "bg-primary/15 border-primary/50 text-foreground"
                        : "bg-[#0F0F14] border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-[#141419]"
                    }`}
                  >
                    <Plus className="w-2.5 h-2.5 inline mr-1" />
                    {addOn}
                  </button>
                ))}
              </div>
            </div>


            {/* Margin Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margin</Label>
                <span className="text-xs font-bold text-primary">{margin}%</span>
              </div>
              <input
                type="range"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full accent-primary h-1.5"
              />
            </div>

            {/* Customer Information */}
            <div className="border-t border-border/30 pt-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                Customer Information
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="Customer Name"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
                <Input
                  value={customerData.company}
                  onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                  placeholder="Company Name"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
                <Input
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
                <Input
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="Email Address"
                  type="email"
                  className="bg-[#0F0F14] border-border/40 rounded-md h-9 text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 sticky bottom-0 pt-3 bg-[#121218]/95 backdrop-blur-sm">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white h-9 text-sm rounded-md">
                <Car className="w-3.5 h-3.5 mr-1.5" />
                Add to Quote
              </Button>
              <Button 
                onClick={handleSendToApproveFlow}
                disabled={sending}
                variant="outline" 
                className="w-full bg-[#0F0F14] border-border/40 hover:bg-[#141419] h-9 text-sm rounded-md"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send to ApproveFlow
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
