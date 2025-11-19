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
import { Plus, ShoppingCart, Lock, Mail } from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { isWPW } from "@/lib/wpwProducts";
import { useQuoteEngine } from "@/hooks/useQuoteEngine";
import { EmailPreviewDialog } from "@/components/mightymail/EmailPreviewDialog";

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
  const { products: allProducts, loading: productsLoading, settings } = useProducts();

  const [selectedService, setSelectedService] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailTone, setEmailTone] = useState("installer");
  const [emailDesign, setEmailDesign] = useState("clean");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Auto-SQFT Quote Engine
  const vehicle = customerData.vehicleYear && customerData.vehicleMake && customerData.vehicleModel
    ? {
        year: customerData.vehicleYear,
        make: customerData.vehicleMake,
        model: customerData.vehicleModel,
      }
    : null;

  const {
    sqft,
    setSqft,
    materialCost,
    laborCost,
    installHours,
    subtotal,
    marginAmount,
    total,
  } = useQuoteEngine(selectedProduct, vehicle, quantity, settings.install_rate_per_hour, margin);

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

  const handleSendQuoteEmail = async () => {
    if (!customerData.email || !customerData.name) {
      toast({
        title: "Missing Information",
        description: "Please enter customer name and email address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct || !total) {
      toast({
        title: "Incomplete Quote",
        description: "Please complete the quote before sending",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-mightymail-quote", {
        body: {
          customerEmail: customerData.email,
          customerName: customerData.name,
          quoteData: {
            vehicle_year: customerData.vehicleYear,
            vehicle_make: customerData.vehicleMake,
            vehicle_model: customerData.vehicleModel,
            product_name: selectedProduct.product_name,
            sqft: sqft,
            material_cost: materialCost,
            labor_cost: laborCost,
            quote_total: total,
            portal_url: window.location.origin + "/mighty-customer",
          },
          tone: emailTone,
          design: emailDesign,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: `Quote email sent successfully to ${customerData.email}`,
      });
    } catch (error: any) {
      console.error("Error sending quote email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send quote email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const toggleAddOn = (addOn: string) => {
    setAddOns(prev => 
      prev.includes(addOn)
        ? prev.filter(a => a !== addOn)
        : [...prev, addOn]
    );
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = async (product: Product) => {
    // Validate product is WPW and has valid WooCommerce ID
    if (!product.woo_product_id || !isWPW(product.woo_product_id)) {
      toast({
        title: "Cannot Add to Cart",
        description: "This product is for quoting only and cannot be added to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      
      // Call server-side protected edge function
      const { data, error } = await supabase.functions.invoke('add-to-woo-cart', {
        body: {
          product_id: product.woo_product_id,
          quantity: quantity,
        },
      });

      if (error) throw error;

      toast({
        title: "Added to Cart",
        description: `${product.product_name} added to your cart!`,
      });
      
      console.log("Added to cart:", data);
    } catch (error) {
      console.error("Cart error:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
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
                  setSelectedProduct(null);
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
                setSelectedProduct(null);
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
                  {filteredProducts.map((product) => {
                    const productIsWPW = product.woo_product_id && isWPW(product.woo_product_id);
                    const isSelected = selectedProduct?.id === product.id;
                    
                    return (
                      <div key={product.id} className="relative">
                        <button
                          onClick={() => handleProductSelect(product)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{product.product_name}</span>
                            {product.is_locked && (
                              <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                          )}
                          <p className="text-xs font-semibold mt-2">
                            {product.pricing_type === 'per_sqft' 
                              ? `$${product.price_per_sqft}/sqft`
                              : `$${product.flat_price} flat`
                            }
                          </p>
                          {product.product_type === 'quote-only' && (
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Quote Only
                            </span>
                          )}
                          {productIsWPW && (
                            <span className="text-xs text-blue-400 mt-1 block font-medium">
                              WPW Product
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Vehicle Information & Auto-SQFT */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-lg font-semibold">Vehicle Information</Label>
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

            {/* Auto-calculated SQFT Display */}
            <div className="p-4 bg-gradient-to-r from-blue-950/50 to-blue-900/30 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-blue-300 text-base font-semibold">Total SQFT</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sqft > 0 ? "✓ Auto-calculated from vehicle database" : "Enter vehicle details above"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={sqft || ""}
                    onChange={(e) => setSqft(Number(e.target.value))}
                    placeholder="0"
                    className="w-28 text-xl font-bold text-right bg-background"
                  />
                  <span className="text-sm text-muted-foreground font-medium">sq ft</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Summary */}
          {selectedProduct && sqft > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-semibold">Quote Summary</Label>
              <div className="p-4 bg-gradient-to-br from-background to-muted/20 rounded-lg border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Material Cost:</span>
                  <span className="font-semibold">${materialCost.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Labor ({installHours}h × ${settings.install_rate_per_hour}/h):
                  </span>
                  <span className="font-semibold">${laborCost.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margin ({margin}%):</span>
                  <span className="font-semibold text-blue-400">${marginAmount.toFixed(2)}</span>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-lg font-semibold">Email Settings</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Tone</Label>
                <Select value={emailTone} onValueChange={setEmailTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installer">Pro Installer</SelectItem>
                    <SelectItem value="luxury">Luxury Auto Spa</SelectItem>
                    <SelectItem value="hype">Hype Restyler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email Design</Label>
                <Select value={emailDesign} onValueChange={setEmailDesign}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
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
            
            <Button
              onClick={() => setEmailPreviewOpen(true)}
              variant="outline"
              disabled={!selectedProduct || !total}
              className="flex-1 border-primary/40 hover:bg-primary/10"
            >
              <Mail className="mr-2 h-4 w-4" />
              Preview Email
            </Button>

            <Button
              onClick={handleSendQuoteEmail}
              disabled={isSendingEmail || !selectedProduct || !total || !customerData.email || !customerData.name}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSendingEmail ? "Sending..." : "Send Quote Email"}
            </Button>
            
            {(() => {
              if (!selectedProduct) {
                return (
                  <Button
                    disabled
                    className="flex-1 bg-gray-600 cursor-not-allowed"
                  >
                    Select a Product
                  </Button>
                );
              }

              // Check if this is a WPW product with valid WooCommerce ID
              const productIsWPW = selectedProduct.product_type === 'wpw' && 
                           selectedProduct.woo_product_id && 
                           isWPW(selectedProduct.woo_product_id);
              
              return productIsWPW ? (
                <Button
                  onClick={() => handleAddToCart(selectedProduct)}
                  disabled={isSending || sqft === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isSending ? "Adding..." : "Add to Cart"}
                </Button>
              ) : (
                <Button
                  disabled
                  className="flex-1 bg-gray-600 cursor-not-allowed"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Quote Only
                </Button>
              );
            })()}
          </div>
        </Card>
        
        <EmailPreviewDialog
          open={emailPreviewOpen}
          onOpenChange={setEmailPreviewOpen}
          quoteData={{
            customerName: customerData.name,
            vehicleYear: customerData.vehicleYear,
            vehicleMake: customerData.vehicleMake,
            vehicleModel: customerData.vehicleModel,
            productName: selectedProduct?.product_name,
            sqft: sqft,
            materialCost: materialCost,
            laborCost: laborCost,
            total: total,
            portalUrl: window.location.origin + "/mighty-customer",
          }}
          tone={emailTone}
          design={emailDesign}
        />
      </div>
    </div>
  );
}
