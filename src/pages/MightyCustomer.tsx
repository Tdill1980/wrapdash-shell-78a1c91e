import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VoiceCommand from "@/components/VoiceCommand";
import { Plus, ShoppingCart, Lock, Mail, Eye, AlertCircle, Package, Ruler, CheckCircle } from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { isWPW, isWBTY, isFadeWrap, STANDALONE_PRODUCTS, WBTY_PRICING, FADEWRAPS_PRICING, WALL_WRAP_PRICING } from "@/lib/wpwProducts";
import { useQuoteEngine } from "@/hooks/useQuoteEngine";
import { useTenantCapabilities } from "@/hooks/useTenantCapabilities";
import { EmailPreviewDialog } from "@/components/mightymail/EmailPreviewDialog";
import { MainLayout } from "@/layouts/MainLayout";
import { PanelVisualization } from "@/components/PanelVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleSelectorV2 } from "@/components/VehicleSelectorV2";
import { VehicleSQFTOptions } from "@/hooks/useVehicleDimensions";
import { Badge } from "@/components/ui/badge";
import { QuoteActionButtons } from "@/components/quote/QuoteActionButtons";
import { QuoteInputModeToggle, InputMode } from "@/components/quote/QuoteInputModeToggle";
import { WrapByTheYardConfigurator } from "@/components/quote/WrapByTheYardConfigurator";
import { FadeWrapConfigurator } from "@/components/quote/FadeWrapConfigurator";
import { WallWrapConfigurator } from "@/components/quote/WallWrapConfigurator";
import { QuoteModeSelector, QuoteMode } from "@/components/quote/QuoteModeSelector";
import { CustomerInfoSection } from "@/components/quote/CustomerInfoSection";
import { ContactData } from "@/hooks/useContactLookup";

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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Tenant capabilities - gates install features at the data layer
  const { installsEnabled } = useTenantCapabilities();

  // Products hook - only loads install settings (labor rates) when installs are enabled
  // For print-only tenants (WPW), labor rates are NOT queried
  const { products: allProducts, loading: productsLoading, settings } = useProducts({
    loadInstallSettings: installsEnabled,
  });

  // WPW Internal Mode - detect from URL params (legacy support)
  const isWPWInternal = searchParams.get('mode') === 'wpw_internal';
  const sourceConversationId = searchParams.get('conversation_id') || null;
  const prefillCustomer = searchParams.get('customer') || '';
  const prefillEmail = searchParams.get('email') || '';
  const prefillPhone = searchParams.get('phone') || '';
  const prefillYear = searchParams.get('year') || '';
  const prefillMake = searchParams.get('make') || '';
  const prefillModel = searchParams.get('model') || '';

  const [selectedService, setSelectedService] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [customerData, setCustomerData] = useState({
    name: prefillCustomer,
    company: "",
    phone: prefillPhone,
    email: prefillEmail,
    vehicleYear: prefillYear,
    vehicleMake: prefillMake,
    vehicleModel: prefillModel,
  });
  // Domain-based defaults: main wrapcommandai.com = wholesale (OFF), subdomains = retail shops (ON)
  const isSubdomain = useMemo(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    // vinylvixen.wrapcommandai.com → true (subdomain shop)
    // wrapcommandai.com, localhost, lovable previews → false (wholesale/main)
    return parts.length > 2 &&
           !hostname.includes('lovableproject.com') &&
           !hostname.includes('lovable.app') &&
           hostname !== 'localhost';
  }, []);

  // Labor and Margin toggles - default based on domain type
  const [laborEnabled, setLaborEnabled] = useState(isSubdomain);
  const [marginEnabled, setMarginEnabled] = useState(isSubdomain);
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
  
  // Quote mode: Quick Price (skip customer info) vs Full Quote
  const [quoteMode, setQuoteMode] = useState<QuoteMode>("full");
  const [foundContact, setFoundContact] = useState<ContactData | null>(null);
  
  // Quote input mode state (Total Sq Ft | Dimensions | Vehicle)
  const [inputMode, setInputMode] = useState<InputMode>("vehicle");
  
  // Specialty configurator state
  const [specialtyConfig, setSpecialtyConfig] = useState<{
    wbty?: { collection: string; pattern: string; yards: number };
    fadewrap?: { color: string; size: string; addOns: string[] };
    wallwrap?: { height: number; width: number; finish: string };
  }>({});
  
  // Saved quote state for payment workflow
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [savedQuoteNumber, setSavedQuoteNumber] = useState<string | null>(null);
  const [quoteIsPaid, setQuoteIsPaid] = useState(false);
  const [quoteShopflowOrderId, setQuoteShopflowOrderId] = useState<string | null>(null);
  const [quoteArtworkFiles, setQuoteArtworkFiles] = useState<Array<{ name: string; url: string; size: number }>>([]);
  
  // Dimension calculator state for trailers/custom
  const [dimLength, setDimLength] = useState(0);
  const [dimHeight, setDimHeight] = useState(0);
  const [dimSides, setDimSides] = useState(2);
  
  // Supabase-powered SQFT options from VehicleSelectorV2
  const [dbSqftOptions, setDbSqftOptions] = useState<VehicleSQFTOptions | null>(null);

  // Auto-SQFT Quote Engine - memoize vehicle to prevent re-render loops
  const vehicle = useMemo(() => {
    if (!customerData.vehicleYear || !customerData.vehicleMake || !customerData.vehicleModel) {
      return null;
    }
    return {
      year: customerData.vehicleYear,
      make: customerData.vehicleMake,
      model: customerData.vehicleModel,
    };
  }, [customerData.vehicleYear, customerData.vehicleMake, customerData.vehicleModel]);

  // Quote engine with tenant-gated install features
  // Labor and margin are controlled by both tenant capability AND manual toggles
  const {
    sqft,
    setSqft,
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
    {
      // Labor is enabled when: tenant allows installs AND labor toggle is ON
      installsEnabled: installsEnabled && laborEnabled,
      installRatePerHour: settings.install_rate_per_hour,
      // Margin only applied when toggle is ON (pass 0 when disabled)
      margin: marginEnabled ? margin : 0,
      includeRoof,
      selectedPanels: wrapType === 'partial' ? selectedPanels : null,
    }
  );

  // Track vehicle match status - now driven by Supabase lookup
  useEffect(() => {
    if (dbSqftOptions && vehicle) {
      setVehicleMatchFound(true);
      setIsManualSqft(false);
    } else if (vehicle && !dbSqftOptions) {
      setVehicleMatchFound(false);
    }
  }, [dbSqftOptions, vehicle]);

  // Handle SQFT options from VehicleSelectorV2 (Supabase-powered)
  const handleSQFTOptionsChange = (options: VehicleSQFTOptions | null) => {
    setDbSqftOptions(options);
    if (options && !isManualSqft) {
      // Auto-set SQFT based on wrap type and roof selection
      if (wrapType === 'full') {
        setSqft(includeRoof ? options.withRoof : options.withoutRoof);
      } else {
        // Partial wrap - calculate from selected panels
        let total = 0;
        if (selectedPanels.sides) total += options.panels.sides;
        if (selectedPanels.back) total += options.panels.back;
        if (selectedPanels.hood) total += options.panels.hood;
        if (selectedPanels.roof) total += options.panels.roof;
        setSqft(total);
      }
    }
  };

  // Custom setSqft wrapper to track manual entries
  const handleSqftChange = (value: number) => {
    setSqft(value);
    setIsManualSqft(true);
  };

  const handleVoiceTranscript = (transcript: string, parsedData: any) => {
    console.log('Voice transcript received:', transcript);
    console.log('Parsed data:', parsedData);
    
    // Update customer data with parsed info - check both flat and nested keys
    const vehicleYear = parsedData.vehicleYear || parsedData.year || '';
    const vehicleMake = parsedData.vehicleMake || parsedData.make || '';
    const vehicleModel = parsedData.vehicleModel || parsedData.model || '';
    const customerName = parsedData.customerName || '';
    const email = parsedData.email || '';
    const phone = parsedData.phone || '';
    const company = parsedData.companyName || '';
    
    setCustomerData(prev => ({
      ...prev,
      name: customerName || prev.name,
      company: company || prev.company,
      phone: phone || prev.phone,
      email: email || prev.email,
      vehicleYear: vehicleYear || prev.vehicleYear,
      vehicleMake: vehicleMake || prev.vehicleMake,
      vehicleModel: vehicleModel || prev.vehicleModel,
    }));
    
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
    
    // Handle finish from transcript or parsed data
    const finishValue = parsedData.finish || '';
    if (finishValue) {
      setFinish(finishValue);
    } else {
      const lower = transcript.toLowerCase();
      if (lower.includes("gloss")) setFinish("Gloss");
      if (lower.includes("matte")) setFinish("Matte");
      if (lower.includes("satin")) setFinish("Satin");
    }
    
    // Show what was parsed
    const parsedFields = [];
    if (customerName) parsedFields.push(`Name: ${customerName}`);
    if (email) parsedFields.push(`Email: ${email}`);
    if (vehicleYear && vehicleMake && vehicleModel) parsedFields.push(`Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel}`);
    
    if (parsedFields.length > 0) {
      toast({
        title: "Voice Data Parsed",
        description: parsedFields.join(' • '),
      });
    }
    
    // Force re-render after state updates to trigger SQFT recalculation
    setTimeout(() => {
      setCustomerData(prev => ({ ...prev }));
    }, 150);
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

      // Use WePrintWraps Supabase for send-mightymail-quote (NOT Lovable)
      const wpwFunctionsUrl = 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1';
      const response = await fetch(`${wpwFunctionsUrl}/send-mightymail-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          quoteId: null,
          customerId: customer?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

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
    if (!selectedProduct || !total) {
      toast({
        title: "Incomplete Quote",
        description: "Please select a product and ensure total is calculated",
        variant: "destructive",
      });
      return;
    }

    setIsSavingQuote(true);
    try {
      const quoteNumber = `WPW-${Date.now().toString().slice(-6)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

      // Use WePrintWraps Supabase edge function for save-quote
      const wpwFunctionsUrl = 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1';

      const response = await fetch(
        `${wpwFunctionsUrl}/save-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quote_number: quoteNumber,
            customer_name: customerData.name,
            customer_email: customerData.email,
            customer_phone: customerData.phone,
            customer_company: customerData.company,
            vehicle_year: customerData.vehicleYear || null,
            vehicle_make: customerData.vehicleMake || null,
            vehicle_model: customerData.vehicleModel || null,
            source: 'mightycustomer',
            vehicle_details: JSON.stringify({
              year: customerData.vehicleYear,
              make: customerData.vehicleMake,
              model: customerData.vehicleModel,
              wrapType: wrapType,
              includeRoof: includeRoof,
              selectedPanels: wrapType === 'partial' ? selectedPanels : null,
              sqftOptions: dbSqftOptions
            }),
            product_name: selectedProduct.product_name,
            sqft: sqft,
            material_cost: materialCost,
            labor_cost: installsEnabled ? laborCost : 0,
            total_price: total,
            margin: installsEnabled ? margin : 0,
            status: "draft",
            auto_retarget: installsEnabled,
            email_tone: emailTone,
            email_design: emailDesign,
            expires_at: expiresAt.toISOString(),
            quote_type: installsEnabled ? 'standard' : 'material_only',
            source_conversation_id: sourceConversationId,
            is_paid: false,
            artwork_files: [],
            artwork_status: 'none',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save quote');
      }

      const savedQuote = await response.json();

      // Store the saved quote info for payment workflow
      setSavedQuoteId(savedQuote.id);
      setSavedQuoteNumber(quoteNumber);
      setQuoteIsPaid(false);
      setQuoteShopflowOrderId(null);
      setQuoteArtworkFiles([]);

      toast({
        title: "Quote Saved!",
        description: `Quote ${quoteNumber} has been saved. You can now mark it as paid to create an order.`,
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

  const handlePaymentComplete = (result: { order_number: string; shopflow_order_id: string }) => {
    setQuoteIsPaid(true);
    setQuoteShopflowOrderId(result.shopflow_order_id);
    toast({
      title: "Order Created!",
      description: `Order ${result.order_number} has been created and customer has been notified.`,
    });
  };

  const handleArtworkUpload = (files: Array<{ name: string; url: string; size: number }>) => {
    setQuoteArtworkFiles(files);
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
    // Reset specialty config when product changes
    setSpecialtyConfig({});
  };

  // Specialty product detection
  const getSpecialtyProductType = (product: Product | null): 'wbty' | 'fadewrap' | 'wallwrap' | null => {
    if (!product?.woo_product_id) return null;
    if (isWBTY(product.woo_product_id)) return 'wbty';
    if (isFadeWrap(product.woo_product_id)) return 'fadewrap';
    if (product.woo_product_id === STANDALONE_PRODUCTS.wallWrap.id) return 'wallwrap';
    return null;
  };

  const specialtyType = getSpecialtyProductType(selectedProduct);


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
      const { data, error } = await lovableFunctions.functions.invoke('add-to-woo-cart', {
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
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MightyCustomer™
            </h1>
            {!installsEnabled && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 flex items-center gap-1">
                <Package className="h-3 w-3" />
                Print Only
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {!installsEnabled ? 'Material-Only Quote Builder' : 'Quote Builder & Order Management'}
          </p>
        </div>

        <Card className="dashboard-card p-6 space-y-6 relative">
          <VoiceCommand onTranscript={handleVoiceTranscript} />
          
          {/* Step 0: Quote Mode Selector */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Quote Mode</Label>
            <QuoteModeSelector mode={quoteMode} onModeChange={setQuoteMode} />
          </div>

          {/* Step 1: Customer Info (Full Quote mode only) */}
          {quoteMode === "full" && (
            <CustomerInfoSection
              customerData={customerData}
              onCustomerDataChange={(data) => setCustomerData(prev => ({ ...prev, ...data }))}
              onContactFound={(contact) => setFoundContact(contact)}
            />
          )}

          {/* Step 2: Select Category */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">
              {quoteMode === "quick" ? "1. Select Category" : "2. Select Category"}
            </Label>
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
                        ? `bg-gradient-to-r from-primary to-primary/60 hover:from-primary/90 hover:to-primary/50 text-primary-foreground border-0 ${isSelected ? 'ring-2 ring-primary/50' : ''}`
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
                <Label className="text-lg font-semibold">
                  {quoteMode === "quick" ? "2. Select Product" : "3. Select Product"}
                </Label>
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

          {/* Specialty Product Configurators OR Standard Vehicle Input */}
          {selectedProduct && specialtyType ? (
            <div className="space-y-4 pt-4 border-t">
              {specialtyType === 'wbty' && (
                <WrapByTheYardConfigurator
                  collectionId={selectedProduct.woo_product_id!}
                  onAddToCart={async (config) => {
                    setSpecialtyConfig({ 
                      wbty: { 
                        collection: selectedProduct.product_name, 
                        pattern: config.pattern, 
                        yards: config.yards 
                      } 
                    });
                    // Call the add-to-cart
                    try {
                      setIsSending(true);
                      const { error } = await lovableFunctions.functions.invoke('add-to-woo-cart', {
                        body: {
                          product_id: config.productId,
                          quantity: config.yards,
                          meta_data: [
                            { key: 'Pattern', value: config.pattern },
                            { key: 'Yards', value: config.yards.toString() },
                          ],
                        },
                      });
                      if (error) throw error;
                      toast({
                        title: "Added to Cart",
                        description: `${selectedProduct.product_name} - ${config.pattern} (${config.yards} yards) added!`,
                      });
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
                  }}
                  isLoading={isSending}
                />
              )}
              
              {specialtyType === 'fadewrap' && (
                <FadeWrapConfigurator
                  onAddToCart={async (config) => {
                    setSpecialtyConfig({ 
                      fadewrap: { 
                        color: config.color, 
                        size: config.size, 
                        addOns: config.addOns 
                      } 
                    });
                    // Call the add-to-cart
                    try {
                      setIsSending(true);
                      const { error } = await lovableFunctions.functions.invoke('add-to-woo-cart', {
                        body: {
                          product_id: config.productId,
                          quantity: 1,
                          meta_data: [
                            { key: 'Color', value: config.color },
                            { key: 'Size', value: config.size },
                            { key: 'Add-Ons', value: config.addOns.join(', ') || 'None' },
                          ],
                        },
                      });
                      if (error) throw error;
                      toast({
                        title: "Added to Cart",
                        description: `FadeWrap - ${config.color} ${config.size} added!`,
                      });
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
                  }}
                  isLoading={isSending}
                />
              )}
              
              {specialtyType === 'wallwrap' && (
                <WallWrapConfigurator
                  onQuote={(config) => {
                    setSpecialtyConfig({ 
                      wallwrap: { 
                        height: 0, // Will be calculated from sqft
                        width: 0, 
                        finish: config.finish 
                      } 
                    });
                    // Set sqft for quote engine
                    setSqft(config.sqft);
                    toast({
                      title: "Wall Wrap Added",
                      description: `${config.sqft} sq ft at $${config.total.toFixed(2)} added to quote.`,
                    });
                  }}
                  isLoading={isSending}
                />
              )}
            </div>
          ) : selectedProduct ? (
            /* Standard Vehicle Information & Auto-SQFT - Only show after product selected */
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-semibold">
                {quoteMode === "quick" ? "3. Size / Square Footage" : "4. Size / Square Footage"}
              </Label>
              
              {/* 3-Mode Quote Input Toggle */}
              <QuoteInputModeToggle
                mode={inputMode}
                onModeChange={setInputMode}
                sqft={sqft}
                onSqftChange={handleSqftChange}
                vehicle={{
                  year: customerData.vehicleYear,
                  make: customerData.vehicleMake,
                  model: customerData.vehicleModel,
                }}
                onVehicleChange={(v) => setCustomerData(prev => ({
                  ...prev,
                  vehicleYear: v.year,
                  vehicleMake: v.make,
                  vehicleModel: v.model,
                }))}
                onSQFTOptionsChange={handleSQFTOptionsChange}
              />

              {/* Wrap Type Selection - only show in vehicle mode when we have SQFT options */}
              {inputMode === 'vehicle' && dbSqftOptions && (
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
                            {dbSqftOptions.withoutRoof} sq. ft.
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
                            {dbSqftOptions.withRoof} sq. ft.
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +{dbSqftOptions.roofOnly} sq. ft. roof
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
                              {dbSqftOptions.panels.sides} sq. ft.
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
                              {dbSqftOptions.panels.back} sq. ft.
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
                              {dbSqftOptions.panels.hood} sq. ft.
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
                              {dbSqftOptions.panels.roof} sq. ft.
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
                              {dbSqftOptions.panels.sides} sq. ft.
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
                              {dbSqftOptions.panels.back} sq. ft.
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
                              {dbSqftOptions.panels.hood} sq. ft.
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
                              {dbSqftOptions.panels.roof} sq. ft.
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicle Not Found Manual Override */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    {vehicleMatchFound ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">Vehicle found in database</span>
                      </>
                    ) : vehicle ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Vehicle not found — enter SQFT manually below</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Select a vehicle or enter SQFT manually</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Manual SQFT Override - show when not in vehicle mode or vehicle not found */}
              {(inputMode !== 'vehicle' || !vehicleMatchFound) && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Manual Sq. Ft. Entry
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Enter total sq. ft."
                      value={sqft > 0 && isManualSqft ? sqft : ""}
                      onChange={(e) => handleSqftChange(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="flex items-center text-lg font-semibold text-primary">
                      {sqft > 0 ? `${sqft} sq ft` : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Dimension Calculator for Trailers/Custom */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimension Calculator (Trailers, RVs, Custom)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Length (ft)</Label>
                    <Input 
                      type="number" 
                      placeholder="14" 
                      value={dimLength || ""} 
                      onChange={(e) => setDimLength(Number(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Height (ft)</Label>
                    <Input 
                      type="number" 
                      placeholder="6" 
                      value={dimHeight || ""} 
                      onChange={(e) => setDimHeight(Number(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground"># of Sides</Label>
                    <Input 
                      type="number" 
                      placeholder="2" 
                      min="1" 
                      max="4" 
                      value={dimSides || ""} 
                      onChange={(e) => setDimSides(Number(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const calculatedSqft = dimLength * dimHeight * dimSides;
                    if (calculatedSqft > 0) {
                      handleSqftChange(calculatedSqft);
                    }
                  }}
                  disabled={dimLength <= 0 || dimHeight <= 0 || dimSides <= 0}
                  className="w-full"
                >
                  Calculate: {dimLength * dimHeight * dimSides} sq ft → Apply
                </Button>
              </div>
            </div>
          ) : null}

          {/* Quote Summary */}
          {selectedProduct && sqft > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-semibold">
                {!installsEnabled ? 'Material Quote Summary' : 'Quote Summary'}
              </Label>
              <div className="p-4 bg-gradient-to-br from-background to-muted/20 rounded-lg border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Material Cost:</span>
                  <span className="font-semibold">${materialCost.toFixed(2)}</span>
                </div>

                {/* Install-related UI - only mounted when installsEnabled is true */}
                {installsEnabled && (
                  <>
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
                  </>
                )}

                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">
                      {!installsEnabled ? 'Material Total:' : 'Total:'}
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  {!installsEnabled && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Print-only pricing • No installation labor or margin
                    </p>
                  )}
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

          {/* Labor and Margin toggles - always visible, controlled by toggles */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <Label className="text-lg font-semibold">Pricing Options</Label>
            <p className="text-sm text-muted-foreground">
              {isSubdomain ? "Retail pricing (install shop)" : "Wholesale pricing (material only)"}
            </p>

            {/* Labor Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="labor-toggle" className="text-base">Include Labor</Label>
                <p className="text-xs text-muted-foreground">
                  Add installation labor costs to the quote
                </p>
              </div>
              <Switch
                id="labor-toggle"
                checked={laborEnabled}
                onCheckedChange={setLaborEnabled}
              />
            </div>

            {/* Margin Toggle + Slider */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="margin-toggle" className="text-base">Include Margin</Label>
                <p className="text-xs text-muted-foreground">
                  Add profit margin to the quote
                </p>
              </div>
              <Switch
                id="margin-toggle"
                checked={marginEnabled}
                onCheckedChange={setMarginEnabled}
              />
            </div>

            {/* Margin percentage slider - only shown when margin is enabled */}
            {marginEnabled && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Margin Percentage: {margin}%</Label>
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
            )}
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
                <Label>Email <span className="text-muted-foreground text-xs">(required to send quote)</span></Label>
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
              disabled={isSavingQuote || !selectedProduct || !total}
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

          {/* Quote Payment & Order Conversion Section */}
          {savedQuoteId && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">Quote Saved: {savedQuoteNumber}</span>
              </div>
              <QuoteActionButtons
                quoteId={savedQuoteId}
                isPaid={quoteIsPaid}
                shopflowOrderId={quoteShopflowOrderId}
                artworkFiles={quoteArtworkFiles}
                onPaymentComplete={handlePaymentComplete}
                onArtworkUpload={handleArtworkUpload}
              />
            </div>
          )}
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
        {showPanelVisualization && vehicle && dbSqftOptions && (
          <PanelVisualization
            vehicle={vehicle}
            sqftOptions={dbSqftOptions}
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
