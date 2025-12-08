import { useState, useEffect } from "react";
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
import { Plus, ShoppingCart, Lock, Mail, Eye, AlertCircle } from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { isWPW } from "@/lib/wpwProducts";
import { useQuoteEngine } from "@/hooks/useQuoteEngine";
import { EmailPreviewDialog } from "@/components/mightymail/EmailPreviewDialog";
import { MainLayout } from "@/layouts/MainLayout";
import { PanelVisualization } from "@/components/PanelVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = ["WePrintWraps.com products", "Full Wraps", "Partial Wraps", "Chrome Delete", "PPF", "Window Tint"];

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
  const [includeRoof, setIncludeRoof] = useState(true);
  const [wrapType, setWrapType] = useState<'full' | 'partial'>('full');
  const [selectedPanels, setSelectedPanels] = useState({
    sides: true,
    back: true,
    hood: true,
    roof: true,
  });
  const [isSending, setIsSending] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailTone, setEmailTone] = useState("installer");
  const [emailDesign, setEmailDesign] = useState("clean");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [showPanelVisualization, setShowPanelVisualization] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState("regular");
  const [isManualSqft, setIsManualSqft] = useState(false);
  const [vehicleMatchFound, setVehicleMatchFound] = useState(false);

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
    sqftOptions,
    panelCosts,
    materialCost,
    laborCost,
    installHours,
    subtotal,
    marginAmount,
    total,
  } = useQuoteEngine(
    selectedProduct,
    vehicle,
    quantity,
    settings.install_rate_per_hour,
    margin,
    includeRoof,
    wrapType === 'partial' ? selectedPanels : null
  );

  // Track vehicle match status
  useEffect(() => {
    if (sqftOptions && vehicle) {
      setVehicleMatchFound(true);
      setIsManualSqft(false);
    } else if (vehicle && !sqftOptions) {
      setVehicleMatchFound(false);
    }
  }, [sqftOptions, vehicle]);

  // Custom setSqft wrapper to track manual entries
  const handleSqftChange = (value: number) => {
    setSqft(value);
    setIsManualSqft(true);
  };

  const handleVoiceTranscript = (transcript: string, parsedData: any) => {
    console.log('Voice transcript received:', transcript);
    console.log('Parsed data:', parsedData);
    
    // Update customer data with parsed info
    if (parsedData.customerName || parsedData.companyName || parsedData.phone || parsedData.email) {
      setCustomerData(prev => ({
        ...prev,
        name: parsedData.customerName || prev.name,
        company: parsedData.companyName || prev.company,
        phone: parsedData.phone || prev.phone,
        email: parsedData.email || prev.email,
        vehicleYear: parsedData.year || prev.vehicleYear,
        vehicleMake: parsedData.make || prev.vehicleMake,
        vehicleModel: parsedData.model || prev.vehicleModel,
      }));
    }
    
    // Update service type if parsed
    if (parsedData.serviceType) {
      const serviceMap: Record<string, string> = {
        "Printed Vinyl": "Full Wraps",
        "Color Change": "Full Wraps", 
        "PPF": "PPF",
        "Tint": "Window Tint",
        "Window Perf": "Window Perf",
        "Wall Wrap": "Full Wraps"
      };
      const mappedService = serviceMap[parsedData.serviceType];
      if (mappedService) {
        setSelectedService(mappedService);
      }
    }
    
    // Set product if available
    if (parsedData.productType && allProducts.length > 0) {
      const matchingProduct = allProducts.find(p => 
        p.product_name.toLowerCase().includes(parsedData.productType.toLowerCase())
      );
      if (matchingProduct) {
        setSelectedProduct(matchingProduct);
      }
    }
    
    // Handle finish from transcript
    const lower = transcript.toLowerCase();
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
      // Get customer ID if they exist in retarget_customers
      const { data: customer } = await supabase
        .from('email_retarget_customers')
        .select('id')
        .eq('email', customerData.email)
        .maybeSingle();

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
          quoteId: null, // Will be set when quote is saved
          customerId: customer?.id || null,
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

  const handleSaveQuote = async () => {
    if (!customerData.name || !customerData.email) {
      toast({
        title: "Missing Information",
        description: "Please enter customer name and email",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct || !total) {
      toast({
        title: "Incomplete Quote",
        description: "Please complete the quote before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSavingQuote(true);
    try {
      const quoteNumber = `WPW-${Date.now().toString().slice(-6)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

      const { error } = await supabase.from("quotes").insert({
        quote_number: quoteNumber,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_company: customerData.company,
        vehicle_year: customerData.vehicleYear || null,
        vehicle_make: customerData.vehicleMake || null,
        vehicle_model: customerData.vehicleModel || null,
        vehicle_details: JSON.stringify({
          year: customerData.vehicleYear,
          make: customerData.vehicleMake,
          model: customerData.vehicleModel,
          wrapType: wrapType,
          includeRoof: includeRoof,
          selectedPanels: wrapType === 'partial' ? selectedPanels : null,
          sqftOptions: sqftOptions
        }),
        product_name: selectedProduct.product_name,
        sqft: sqft,
        material_cost: materialCost,
        labor_cost: laborCost,
        total_price: total,
        margin: margin,
        status: "pending",
        auto_retarget: true,
        email_tone: emailTone,
        email_design: emailDesign,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Quote Saved!",
        description: `Quote ${quoteNumber} has been saved successfully`,
      });
    } catch (error: any) {
      console.error("Error saving quote:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save quote",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuote(false);
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
    <MainLayout userName="Admin">
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MightyCustomer™
          </h1>
          <p className="text-muted-foreground">Quote Builder & Order Management</p>
        </div>

        <Card className="dashboard-card p-6 space-y-6 relative">
          <VoiceCommand onTranscript={handleVoiceTranscript} />
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Category</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const isWPWCategory = category === "WePrintWraps.com products";
                const isSelected = selectedService === category;
                return (
                  <Button
                    key={category}
                    variant={isWPWCategory ? (isSelected ? "default" : "ghost") : (isSelected ? "default" : "outline")}
                    onClick={() => {
                      setSelectedService(category);
                      setSelectedProduct(null);
                      setActiveProductTab("regular");
                    }}
                    className={`whitespace-nowrap px-6 ${
                      isWPWCategory
                        ? `bg-gradient-to-r from-[#D946EF] to-[#2F81F7] hover:from-[#E879F9] hover:to-[#60A5FA] text-white border-0 ${isSelected ? 'ring-2 ring-white/50' : ''}`
                        : ""
                    }`}
                  >
                    {category}
                  </Button>
                );
              })}
              <Button
                variant={selectedService === "All Products" ? "default" : "outline"}
              onClick={() => {
                setSelectedService("All Products");
                setSelectedProduct(null);
                setActiveProductTab("regular");
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
              "All Products": "all",
              "WePrintWraps.com products": "wpw"
            };
            
            const categoryKey = categoryMap[selectedService] || "";
            
            // Filter products based on category
            let categoryFiltered;
            if (categoryKey === "all") {
              categoryFiltered = allProducts;
            } else if (categoryKey === "wpw") {
              // Show only WePrintWraps products
              categoryFiltered = allProducts.filter(p => p.woo_product_id && isWPW(p.woo_product_id));
            } else {
              categoryFiltered = allProducts.filter(p => p.category === categoryKey);
            }

            return (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Select Product</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categoryFiltered.map((product) => {
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
                              : `$${product.flat_price} flat`}
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
                        
                        {productIsWPW && (
                          <div className="absolute top-1 right-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Add to Cart
                            </Button>
                          </div>
                        )}
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
            
            {/* Vehicle Lookup Status */}
            {customerData.vehicleYear && customerData.vehicleMake && customerData.vehicleModel && (
              <div className={`p-3 rounded-lg border ${
                sqftOptions 
                  ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                  : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              }`}>
                {sqftOptions ? (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Vehicle found: {customerData.vehicleYear} {customerData.vehicleMake} {customerData.vehicleModel}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Vehicle not found in database. Try exact spelling (e.g., "Tahoe" not "tahoe")
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Year</Label>
                <Input
                  type="text"
                  placeholder="2024"
                  value={customerData.vehicleYear}
                  onChange={(e) => {
                    console.log('Year updated:', e.target.value);
                    setCustomerData(prev => ({ ...prev, vehicleYear: e.target.value }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Make</Label>
                <Input
                  type="text"
                  placeholder="Chevrolet"
                  value={customerData.vehicleMake}
                  onChange={(e) => {
                    console.log('Make updated:', e.target.value);
                    setCustomerData(prev => ({ ...prev, vehicleMake: e.target.value }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Model</Label>
                <Input
                  type="text"
                  placeholder="Tahoe"
                  value={customerData.vehicleModel}
                  onChange={(e) => {
                    console.log('Model updated:', e.target.value);
                    setCustomerData(prev => ({ ...prev, vehicleModel: e.target.value }));
                  }}
                />
              </div>
            </div>

            {/* Wrap Type Selection */}
            {sqftOptions && (
              <div className="space-y-4">
                {/* Show Panel Visualization Button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPanelVisualization(true)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Panel Diagram
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Wrap Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWrapType('full')}
                      type="button"
                      className={`p-4 rounded-lg border-2 transition-all ${
                        wrapType === 'full'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-foreground">Full Wrap</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Complete vehicle coverage
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setWrapType('partial')}
                      type="button"
                      className={`p-4 rounded-lg border-2 transition-all ${
                        wrapType === 'partial'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-foreground">Partial Wrap</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Select specific panels
                      </div>
                    </button>
                  </div>
                </div>

                {/* Full Wrap - Roof Options */}
                {wrapType === 'full' && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Roof Coverage Options</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIncludeRoof(false)}
                        type="button"
                        className={`p-4 rounded-lg border-2 transition-all ${
                          !includeRoof 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-foreground">No Roof Included</div>
                        <div className="text-2xl font-bold text-primary">
                          {sqftOptions.withoutRoof} sq. ft.
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setIncludeRoof(true)}
                        type="button"
                        className={`p-4 rounded-lg border-2 transition-all ${
                          includeRoof 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-foreground">Roof Included</div>
                        <div className="text-2xl font-bold text-primary">
                          {sqftOptions.withRoof} sq. ft.
                        </div>
                        <div className="text-xs text-muted-foreground">
                          +{sqftOptions.roofOnly} sq. ft. roof
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Partial Wrap - Panel Selection */}
                {wrapType === 'partial' && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Panels to Wrap</Label>
                    {selectedProduct && selectedProduct.pricing_type === 'per_sqft' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, sides: !prev.sides }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.sides
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Both Sides</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.sides} sq. ft.
                          </div>
                          {panelCosts.sides > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ${panelCosts.sides.toFixed(2)}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, back: !prev.back }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.back
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Back</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.back} sq. ft.
                          </div>
                          {panelCosts.back > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ${panelCosts.back.toFixed(2)}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, hood: !prev.hood }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.hood
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Hood</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.hood} sq. ft.
                          </div>
                          {panelCosts.hood > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ${panelCosts.hood.toFixed(2)}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, roof: !prev.roof }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.roof
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Roof</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.roof} sq. ft.
                          </div>
                          {panelCosts.roof > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ${panelCosts.roof.toFixed(2)}
                            </div>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, sides: !prev.sides }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.sides
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Both Sides</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.sides} sq. ft.
                          </div>
                        </button>

                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, back: !prev.back }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.back
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Back</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.back} sq. ft.
                          </div>
                        </button>

                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, hood: !prev.hood }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.hood
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Hood</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.hood} sq. ft.
                          </div>
                        </button>

                        <button
                          onClick={() => setSelectedPanels(prev => ({ ...prev, roof: !prev.roof }))}
                          type="button"
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPanels.roof
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Roof</div>
                          <div className="text-lg font-bold text-primary">
                            {sqftOptions.panels.roof} sq. ft.
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Validation Messages */}
            {!vehicle && (
              <div className="flex items-center gap-2 p-3 bg-yellow-950/30 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Enter vehicle details to auto-calculate square footage</span>
              </div>
            )}
            
            {vehicle && !sqftOptions && (
              <div className="flex items-center gap-2 p-3 bg-orange-950/30 border border-orange-500/30 rounded-lg text-orange-200 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Vehicle not in database - please enter square footage manually below</span>
              </div>
            )}

            {wrapType === 'partial' && !selectedPanels.sides && !selectedPanels.back && !selectedPanels.hood && !selectedPanels.roof && (
              <div className="flex items-center gap-2 p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg text-blue-200 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Select at least one panel to wrap</span>
              </div>
            )}

            {/* Auto-calculated SQFT Display with Visual Feedback */}
            <div className={`p-4 rounded-lg border-2 transition-all ${
              vehicleMatchFound && !isManualSqft
                ? 'bg-gradient-to-r from-green-950/50 to-green-900/30 border-green-500/40'
                : isManualSqft
                  ? 'bg-gradient-to-r from-purple-950/50 to-purple-900/30 border-purple-500/40'
                  : 'bg-gradient-to-r from-blue-950/50 to-blue-900/30 border-blue-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className={`text-base font-semibold ${
                      vehicleMatchFound && !isManualSqft
                        ? 'text-green-300'
                        : isManualSqft
                          ? 'text-purple-300'
                          : 'text-blue-300'
                    }`}>
                      {sqftOptions 
                        ? wrapType === 'full'
                          ? (includeRoof ? "Total SQFT (Roof Included)" : "Total SQFT (No Roof)")
                          : "Total SQFT (Selected Panels)"
                        : "Total SQFT"
                      }
                    </Label>
                    {vehicleMatchFound && !isManualSqft && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full border border-green-500/40">
                        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs font-medium text-green-400">Auto</span>
                      </div>
                    )}
                    {isManualSqft && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded-full border border-purple-500/40">
                        <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                        <span className="text-xs font-medium text-purple-400">Manual</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vehicleMatchFound && !isManualSqft
                      ? wrapType === 'partial'
                        ? "✓ Calculated from selected panels"
                        : "✓ Vehicle matched in database"
                      : isManualSqft
                        ? "✎ Manually entered value"
                        : sqft > 0
                          ? "Calculated from panels"
                          : "Enter vehicle details above"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={sqft || ""}
                    onChange={(e) => handleSqftChange(Number(e.target.value))}
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
              onClick={handleSaveQuote}
              variant="outline"
              disabled={isSavingQuote || !selectedProduct || !total || !customerData.name || !customerData.email}
              className="flex-1 border-primary/40 hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isSavingQuote ? "Saving..." : "Save Quote"}
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

        {/* Panel Visualization Modal */}
        {showPanelVisualization && vehicle && sqftOptions && (
          <PanelVisualization
            vehicle={vehicle}
            sqftOptions={sqftOptions}
            selectedPanels={selectedPanels}
            onPanelClick={(panel) => {
              setSelectedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
            }}
            showAsModal={true}
            onClose={() => setShowPanelVisualization(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
