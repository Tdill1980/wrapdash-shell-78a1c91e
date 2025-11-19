import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VoiceCommand from "@/components/VoiceCommand";
import { Plus, ShoppingCart, Lock } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const categories = ["Full Wraps", "Partial Wraps", "Chrome Delete", "PPF", "Window Tint"];

const addOnOptions = [
  "PPF Hood Only",
  "Roof Wrap",
  "Chrome Delete",
  "Window Tint",
  "Custom Graphics",
];

const finishTypes = ["Gloss", "Satin", "Matte", "Gloss PPF", "Matte PPF"];

export default function MightyCustomer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products: allProducts, loading: productsLoading } = useProducts();

  const [selectedService, setSelectedService] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [customerData, setCustomerData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
  });
  const [margin, setMargin] = useState(65);
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState("Gloss");
  const [isSending, setIsSending] = useState(false);

  const handleVoiceTranscript = (transcript: string) => {
    const lower = transcript.toLowerCase();
    
    if (lower.includes("tahoe") || lower.includes("silverado") || lower.includes("f-150")) {
      const vehicleMatch = transcript.match(/(\d{4})\s+(\w+)\s+(\w+)/i);
      if (vehicleMatch) {
        setCustomerData(prev => ({
          ...prev,
          vehicleYear: vehicleMatch[1],
          vehicleMake: vehicleMatch[2],
          vehicleModel: vehicleMatch[3],
        }));
      }
    }
    
    if (lower.includes("full wrap")) {
      setSelectedService("Full Wraps");
    } else if (lower.includes("ppf")) {
      setSelectedService("PPF");
    }
    
    if (lower.includes("name") || lower.includes("customer")) {
      const nameMatch = transcript.match(/(?:name|customer)\s+(\w+(?:\s+\w+)?)/i);
      if (nameMatch) {
        setCustomerData(prev => ({ ...prev, name: nameMatch[1] }));
      }
    }
    
    if (lower.includes("phone")) {
      const phoneMatch = transcript.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
      if (phoneMatch) {
        setCustomerData(prev => ({ ...prev, phone: phoneMatch[1] }));
      }
    }
    
    if (lower.includes("gloss")) setFinish("Gloss");
    if (lower.includes("matte")) setFinish("Matte");
    if (lower.includes("satin")) setFinish("Satin");
  };

  const toggleAddOn = (addOn: string) => {
    setAddOns(prev => 
      prev.includes(addOn)
        ? prev.filter(a => a !== addOn)
        : [...prev, addOn]
    );
  };

  const handleSendToApproveFlow = async () => {
    if (!selectedProduct || !customerData.name) {
      toast({
        title: "Missing Information",
        description: "Please select a product and enter customer name",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const orderTotal = 5000; // Placeholder calculation
      const orderNumber = `QUOTE-${Date.now()}`;

      const { data, error } = await supabase
        .from("approveflow_projects")
        .insert({
          order_number: orderNumber,
          customer_name: customerData.name,
          customer_email: customerData.email || null,
          product_type: selectedProduct,
          status: "design_requested",
          order_total: orderTotal,
          design_instructions: `Vehicle: ${customerData.vehicleYear} ${customerData.vehicleMake} ${customerData.vehicleModel}\nFinish: ${finish}\nAdd-ons: ${addOns.join(", ")}`,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Project sent to ApproveFlow`,
      });

      navigate(`/approveflow/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to send to ApproveFlow",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <VoiceCommand onTranscript={handleVoiceTranscript} />
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MightyCustomer™
          </h1>
          <p className="text-muted-foreground">Quote Builder & Order Management</p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Category</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedService === category ? "default" : "outline"}
                  onClick={() => {
                    setSelectedService(category);
                    setSelectedProduct("");
                  }}
                  className="whitespace-nowrap px-6"
                >
                  {category}
                </Button>
              ))}
              <Button
                variant={selectedService === "All Products" ? "default" : "outline"}
                onClick={() => {
                  setSelectedService("All Products");
                  setSelectedProduct("");
                }}
                className="whitespace-nowrap px-6"
              >
                All Products
              </Button>
            </div>
          </div>

          {selectedService && !productsLoading && (() => {
            const categoryMap: Record<string, string> = {
              "Full Wraps": "full-wraps",
              "Partial Wraps": "partial-wraps",
              "Chrome Delete": "chrome-delete",
              "PPF": "ppf",
              "Window Tint": "window-tint",
              "All Products": "all"
            };
            
            const categoryKey = categoryMap[selectedService] || "";
            const filteredProducts = categoryKey === "all" 
              ? allProducts 
              : allProducts.filter(p => p.category === categoryKey);

            return (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Select Product</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="relative">
                      <button
                        onClick={() => setSelectedProduct(product.product_name)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedProduct === product.product_name
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{product.product_name}</span>
                          {product.product_type === 'quote-only' && (
                            <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                          )}
                        </div>
                        {product.product_type === 'quote-only' && (
                          <span className="text-xs text-muted-foreground mt-1 block">
                            Quote Only — Cannot Add to Cart
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Year</Label>
              <Input
                type="text"
                placeholder="2024"
                value={customerData.vehicleYear}
                onChange={(e) => setCustomerData(prev => ({ ...prev, vehicleYear: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Make</Label>
              <Input
                type="text"
                placeholder="Chevrolet"
                value={customerData.vehicleMake}
                onChange={(e) => setCustomerData(prev => ({ ...prev, vehicleMake: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <Input
                type="text"
                placeholder="Tahoe"
                value={customerData.vehicleModel}
                onChange={(e) => setCustomerData(prev => ({ ...prev, vehicleModel: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Finish Type</Label>
              <Select value={finish} onValueChange={setFinish}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {finishTypes.map(finishType => (
                    <SelectItem key={finishType} value={finishType}>
                      {finishType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Add-Ons</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {addOnOptions.map(addOn => (
                <Button
                  key={addOn}
                  variant={addOns.includes(addOn) ? "default" : "outline"}
                  onClick={() => toggleAddOn(addOn)}
                  className="text-xs"
                >
                  {addOn}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Margin: {margin}%</Label>
            </div>
            <Slider
              value={[margin]}
              onValueChange={([value]) => setMargin(value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-lg font-semibold">Customer Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  type="text"
                  placeholder="John Smith"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  type="text"
                  placeholder="ABC Company"
                  value={customerData.company}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => toast({ title: "Quote Saved", description: "Quote has been saved locally" })}
              variant="outline"
              className="flex-1 border-primary/40 hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Save Quote
            </Button>
            {(() => {
              const product = allProducts.find(p => p.product_name === selectedProduct);
              const isWPW = product?.product_type === 'wpw';
              
              return isWPW ? (
                <Button
                  onClick={() => {
                    toast({
                      title: "Added to Cart",
                      description: `${selectedProduct} added to WooCommerce cart`,
                    });
                  }}
                  disabled={!selectedProduct}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              ) : (
                <Button
                  disabled
                  className="flex-1 bg-gray-600 cursor-not-allowed"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Quote Only – Not Available for Cart
                </Button>
              );
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}
