import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceCommand from "@/components/VoiceCommand";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#121218] to-[#16161E]">
      <VoiceCommand onTranscript={handleVoiceTranscript} />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-primary to-pink-400 bg-clip-text text-transparent">
            MightyCustomer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quote & Order Builder
          </p>
        </div>

        <Card className="bg-[#0A0A0F]/80 border-border/50 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            {/* Service Type Selection */}
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Choose a Service Type
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {serviceTypes.map((service) => {
                  const Icon = service.icon;
                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service.id);
                        setSelectedProduct("");
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedService === service.id
                          ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-primary shadow-glow"
                          : "bg-background/30 border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${
                        selectedService === service.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className={`text-xs font-medium block ${
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
                <Label className="text-sm text-muted-foreground mb-1 block">
                  Choose a Product
                </Label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                >
                  <option value="">Select Product...</option>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">
                  Year
                </Label>
                <Input
                  value={customerData.year}
                  onChange={(e) => setCustomerData({ ...customerData, year: e.target.value })}
                  placeholder="2024"
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">
                  Make
                </Label>
                <Input
                  value={customerData.make}
                  onChange={(e) => setCustomerData({ ...customerData, make: e.target.value })}
                  placeholder="Chevrolet"
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">
                  Model
                </Label>
                <Input
                  value={customerData.model}
                  onChange={(e) => setCustomerData({ ...customerData, model: e.target.value })}
                  placeholder="Tahoe"
                  className="bg-background border-border"
                />
              </div>
            </div>

            {/* Add-Ons */}
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Add-Ons
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {addOnOptions.map((addOn) => (
                  <button
                    key={addOn}
                    onClick={() => toggleAddOn(addOn)}
                    className={`px-3 py-2 rounded-lg border transition-all duration-200 text-xs ${
                      selectedAddOns.includes(addOn)
                        ? "bg-primary/20 border-primary text-foreground"
                        : "bg-background/30 border-border/50 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    {addOn}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Finish */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">
                  Quantity
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">
                  Finish
                </Label>
                <select
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                >
                  <option>Gloss</option>
                  <option>Matte</option>
                  <option>Satin</option>
                </select>
              </div>
            </div>

            {/* Margin Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-muted-foreground">Margin</Label>
                <span className="text-sm font-semibold text-primary">{margin}%</span>
              </div>
              <input
                type="range"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full accent-primary"
              />
            </div>

            {/* Customer Information */}
            <div className="border-t border-border/50 pt-6">
              <Label className="text-sm text-muted-foreground mb-3 block">
                Customer Information
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="Customer Name"
                  className="bg-background border-border"
                />
                <Input
                  value={customerData.company}
                  onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                  placeholder="Company Name"
                  className="bg-background border-border"
                />
                <Input
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="bg-background border-border"
                />
                <Input
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="Email Address"
                  type="email"
                  className="bg-background border-border"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 sticky bottom-0 pt-4 bg-[#0A0A0F]/80 backdrop-blur-sm">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                <Car className="w-4 h-4 mr-2" />
                Add to Quote
              </Button>
              <Button variant="outline" className="w-full bg-background/50 border-border/50">
                Save Customer
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
