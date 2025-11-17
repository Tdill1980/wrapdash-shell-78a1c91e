import { useNavigate } from "react-router-dom";
import {
  Database,
  Mail,
  Users,
  Package,
  Settings,
  FileText,
  Sparkles,
  Car,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Activity,
  ChevronLeft,
  ChevronRight,
  Mic,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDesignVault } from "@/modules/designvault/hooks/useDesignVault";
import { useState, useMemo, useEffect } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useProducts } from "@/hooks/useProducts";
import vehicleDimensionsDataRaw from "@/data/vehicle-dimensions.json";

const vehicleDimensionsData = (vehicleDimensionsDataRaw as any).vehicles || [];

const metrics = [
  {
    title: "Total Renders",
    value: "1,284",
    change: "+12%",
    icon: Activity,
  },
  {
    title: "Production Packs",
    value: "847",
    change: "+8%",
    icon: Package,
  },
  {
    title: "Active Jobs",
    value: "23",
    change: "+5%",
    icon: FileText,
  },
  {
    title: "Revenue",
    value: "$84.2K",
    change: "+18%",
    icon: DollarSign,
  },
  {
    title: "Approvals",
    value: "156",
    change: "+24%",
    icon: CheckCircle,
  },
  {
    title: "Customers",
    value: "412",
    change: "+15%",
    icon: Users,
  },
];

const adminModules = [
  {
    name: "Design Vault",
    subtitle: "Manage uploads",
    icon: Database,
    route: "/designvault",
  },
  {
    name: "MightyMail",
    subtitle: "Email campaigns",
    icon: Mail,
    route: "/email-campaigns",
  },
  {
    name: "Customers",
    subtitle: "Manage customers",
    icon: Users,
    route: "/mightycustomer",
  },
  {
    name: "Orders",
    subtitle: "View all orders",
    icon: Package,
    route: "/shopflow",
  },
  {
    name: "Product Pricing",
    subtitle: "Manage pricing",
    icon: DollarSign,
    route: "/admin/pricing",
  },
  {
    name: "Admin Panel",
    subtitle: "Full admin access",
    icon: Settings,
    route: "/settings",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: designs, isLoading } = useDesignVault();
  const { orders: shopflowOrders, loading: shopflowLoading } = useShopFlow();
  const { products, settings, loading: productsLoading } = useProducts();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput();
  
  // Quote Builder State
  const [productCategory, setProductCategory] = useState<'weprintwraps' | 'window-perf'>('weprintwraps');
  const [product, setProduct] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState("Gloss");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [margin, setMargin] = useState(40);
  const [isVehicleExpanded, setIsVehicleExpanded] = useState(false);
  const [installHours, setInstallHours] = useState(8);
  const [sqFt, setSqFt] = useState(0);
  const [panelWidth, setPanelWidth] = useState(0);
  const [panelHeight, setPanelHeight] = useState(0);
  
  // Parse vehicle dimensions data
  const vehicleData = useMemo(() => {
    const makes = Array.from(new Set(vehicleDimensionsData.map((v: any) => v.Make))).sort();
    
    const modelsByMake = vehicleDimensionsData.reduce((acc: any, v: any) => {
      if (!acc[v.Make]) acc[v.Make] = new Set();
      acc[v.Make].add(v.Model);
      return acc;
    }, {});
    
    // Convert sets to sorted arrays
    Object.keys(modelsByMake).forEach(make => {
      modelsByMake[make] = Array.from(modelsByMake[make]).sort();
    });
    
    return { makes, modelsByMake, data: vehicleDimensionsData };
  }, []);
  
  // Auto-fill sq ft when vehicle is selected
  useEffect(() => {
    if (vehicleMake && vehicleModel && vehicleYear) {
      const match = vehicleData.data.find((v: any) => 
        v.Make === vehicleMake && 
        v.Model === vehicleModel && 
        (v.Year === vehicleYear || v.Year.includes(vehicleYear))
      );
      
      if (match) {
        setSqFt(match["Corrected Sq Foot"] || match["Total Sq Foot"] || 0);
      }
    }
  }, [vehicleMake, vehicleModel, vehicleYear, vehicleData]);
  
  // Pricing calculation based on WPW products
  const selectedProduct = products.find(p => p.product_name === product);
  const materialCost = selectedProduct 
    ? selectedProduct.pricing_type === 'per_sqft'
      ? (selectedProduct.price_per_sqft || 0) * sqFt * quantity
      : (selectedProduct.flat_price || 0) * quantity
    : 0;
  
  const installFee = installHours * settings.install_rate_per_hour;
  const taxRate = settings.tax_rate_percentage / 100;
  const taxAmount = (materialCost + installFee) * taxRate;
  const totalCost = materialCost + installFee + taxAmount;
  
  // Calculate sq ft from panel dimensions
  const calculateSqFt = () => {
    if (panelWidth > 0 && panelHeight > 0) {
      const sqFtCalc = (panelWidth * panelHeight) / 144; // Convert inches to sq ft
      setSqFt(Math.round(sqFtCalc * 100) / 100);
    }
  };
  
  const latestDesigns = designs?.slice(0, 5) || [];

  const productTypes = [
    { name: "Full Wraps", gradient: "bg-gradient-purple-magenta" },
    { name: "Partial Wraps", gradient: "bg-gradient-magenta-blue" },
    { name: "Chrome Delete", gradient: "bg-gradient-plum-pink" },
    { name: "PPF", gradient: "bg-gradient-teal-violet" },
    { name: "Window Tint", gradient: "bg-gradient-primary" },
  ];

  const nextSlide = () => {
    if (latestDesigns.length > 0) {
      setCarouselIndex((prev) => (prev + 1) % latestDesigns.length);
    }
  };

  const prevSlide = () => {
    if (latestDesigns.length > 0) {
      setCarouselIndex((prev) => (prev - 1 + latestDesigns.length) % latestDesigns.length);
    }
  };
  
  const handleVoiceButtonDown = () => {
    startRecording();
  };
  
  const handleVoiceButtonUp = async () => {
    try {
      const transcript = await stopRecording();
      parseAndFillForm(transcript);
    } catch (error) {
      console.error('Voice input error:', error);
    }
  };
  
  const parseAndFillForm = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Parse product type with WPW product names
    if (lowerTranscript.includes("avery wrap") || lowerTranscript.includes("printed wrap")) {
      setProduct("Printed Wrap Film (Avery Brand, UV Lamination)");
    } else if (lowerTranscript.includes("3m wrap") || lowerTranscript.includes("ij180")) {
      setProduct("3M IJ180CV3 + 8518 Lamination");
    } else if (lowerTranscript.includes("avery cut") || lowerTranscript.includes("avery contour")) {
      setProduct("Avery Cut Contour Vinyl Graphics");
    } else if (lowerTranscript.includes("3m cut") || lowerTranscript.includes("3m contour")) {
      setProduct("3M Cut Contour Vinyl Graphics");
    } else if (lowerTranscript.includes("fade wrap")) {
      setProduct("Custom Fade Wrap Printing");
    } else if (lowerTranscript.includes("window perf") || lowerTranscript.includes("perforated")) {
      setProduct("Perforated Window Vinyl 50/50 (Unlaminated)");
    } else if (lowerTranscript.includes("design service") || lowerTranscript.includes("custom design")) {
      setProduct("Custom Vehicle Wrap Design");
    }
    
    // Parse vehicle info - looking for year, make, model patterns
    const yearMatch = transcript.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) setVehicleYear(yearMatch[0]);
    
    // Common car makes
    const makes = ["toyota", "honda", "ford", "chevrolet", "chevy", "tesla", "bmw", "mercedes", "audi", "lexus", "nissan", "hyundai"];
    const foundMake = makes.find(make => lowerTranscript.includes(make));
    if (foundMake) setVehicleMake(foundMake.charAt(0).toUpperCase() + foundMake.slice(1));
    
    // Parse customer name (usually after "for" or "customer")
    const nameMatch = transcript.match(/(?:for|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) setCustomerName(nameMatch[1]);
    
    // Parse email
    const emailMatch = transcript.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (emailMatch) setCustomerEmail(emailMatch[0]);
    
    // Parse quantity
    const qtyMatch = transcript.match(/(\d+)\s*(?:vehicle|car|unit)/i);
    if (qtyMatch) setQuantity(parseInt(qtyMatch[1]));
  };

  return (
    <div className="space-y-4 max-w-[1600px]">

      {/* Product Type Chips */}
      <div className="flex flex-wrap gap-2">
        {productTypes.map((product) => (
          <button
            key={product.name}
            onClick={() => product.name === "Full Wraps" ? navigate("/visualize") : null}
            className={`px-4 py-2 text-xs font-semibold rounded-lg ${product.gradient} text-white hover:opacity-90 transition-opacity`}
          >
            {product.name}
          </button>
        ))}
      </div>

      {/* Two-Column Hero Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Quote Builder Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-poppins">
                  <span className="text-foreground">Mighty</span>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Customer</span>
                  <span className="text-muted-foreground text-sm align-super">™</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Quote & Order Builder
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {/* Voice Command Button - Small in corner */}
                <Button
                  size="sm"
                  onMouseDown={handleVoiceButtonDown}
                  onMouseUp={handleVoiceButtonUp}
                  onTouchStart={handleVoiceButtonDown}
                  onTouchEnd={handleVoiceButtonUp}
                  disabled={isProcessing}
                  className={`${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-primary hover:opacity-90'
                  } text-white w-8 h-8 p-0`}
                  title={isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Intelligent VoiceCommand'}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Product Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Select Product</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.product_name}>
                      {p.product_name} - {p.pricing_type === 'per_sqft' ? `$${p.price_per_sqft}/sq ft` : `$${p.flat_price}`} (ID: {p.woo_product_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Quick Select Buttons */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Printed Wrap Film (Avery Brand, UV Lamination)' ? 'default' : 'outline'}
                    onClick={() => setProduct('Printed Wrap Film (Avery Brand, UV Lamination)')}
                    className="text-xs py-1 h-auto"
                  >
                    Avery Wrap
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === '3M IJ180CV3 + 8518 Lamination' ? 'default' : 'outline'}
                    onClick={() => setProduct('3M IJ180CV3 + 8518 Lamination')}
                    className="text-xs py-1 h-auto"
                  >
                    3M Wrap
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Perforated Window Vinyl 50/50 (Unlaminated)' ? 'default' : 'outline'}
                    onClick={() => setProduct('Perforated Window Vinyl 50/50 (Unlaminated)')}
                    className="text-xs py-1 h-auto"
                  >
                    Window Perf
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Custom Fade Wrap Printing' ? 'default' : 'outline'}
                    onClick={() => setProduct('Custom Fade Wrap Printing')}
                    className="text-xs py-1 h-auto"
                  >
                    Fade Wrap
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Avery Cut Contour Vinyl Graphics' ? 'default' : 'outline'}
                    onClick={() => setProduct('Avery Cut Contour Vinyl Graphics')}
                    className="text-xs py-1 h-auto"
                  >
                    Avery Cut
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/mightycustomer')}
                    className="text-xs py-1 h-auto bg-gradient-primary text-white border-0"
                  >
                    WePrintWraps.com
                  </Button>
                </div>
              </div>

              {/* Collapsible Vehicle Info */}
              <div className="border border-border rounded-md">
                <button
                  onClick={() => setIsVehicleExpanded(!isVehicleExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Car className="w-3 h-3" />
                    <span>Vehicle: {vehicleYear || vehicleMake || vehicleModel ? `${vehicleYear} ${vehicleMake} ${vehicleModel}`.trim() : 'Not set'}</span>
                  </div>
                  {isVehicleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {isVehicleExpanded && (
                  <div className="p-3 space-y-2 border-t border-border">
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={vehicleMake}
                        onChange={(e) => {
                          setVehicleMake(e.target.value);
                          setVehicleModel(""); // Reset model when make changes
                        }}
                        className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Make</option>
                        {vehicleData.makes.map((make: string) => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                      <select
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        disabled={!vehicleMake}
                        className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                      >
                        <option value="">Model</option>
                        {vehicleMake && vehicleData.modelsByMake[vehicleMake]?.map((model: string) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                      <select
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Sq Ft and Panel Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Total Sq. Ft.</label>
                  <input 
                    type="number"
                    value={sqFt}
                    onChange={(e) => setSqFt(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Panel Dimensions (in)</label>
                  <div className="flex gap-1">
                    <input 
                      type="number"
                      value={panelWidth || ''}
                      onChange={(e) => {
                        setPanelWidth(parseFloat(e.target.value) || 0);
                        setTimeout(calculateSqFt, 10);
                      }}
                      placeholder="W"
                      className="w-1/2 bg-background border border-border text-xs px-2 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs flex items-center text-muted-foreground">×</span>
                    <input 
                      type="number"
                      value={panelHeight || ''}
                      onChange={(e) => {
                        setPanelHeight(parseFloat(e.target.value) || 0);
                        setTimeout(calculateSqFt, 10);
                      }}
                      placeholder="H"
                      className="w-1/2 bg-background border border-border text-xs px-2 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity, Finish, and Install Hours */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                  <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Finish</label>
                  <select 
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Gloss</option>
                    <option>Matte</option>
                    <option>Satin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Install Hours</label>
                  <input 
                    type="number"
                    value={installHours}
                    onChange={(e) => setInstallHours(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Margin Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Margin</label>
                  <span className="text-xs font-bold text-primary">{margin}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-1 bg-gradient-primary rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Cost Breakdown */}
              <div className="bg-background/50 rounded-lg p-3 border border-border space-y-1.5">
                <div className="text-xs font-semibold text-foreground mb-2">Cost Breakdown</div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Material ({sqFt} sq ft × {quantity}x)
                    {selectedProduct && (
                      <span className="ml-1 text-xs opacity-70">
                        ID:{selectedProduct.woo_product_id}
                      </span>
                    )}
                  </span>
                  <span className="text-foreground">${materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Install ({installHours}hrs @ ${settings.install_rate_per_hour}/hr)</span>
                  <span className="text-foreground">${installFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax ({settings.tax_rate_percentage}%)</span>
                  <span className="text-foreground">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-border pt-1.5 mt-1.5">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs text-muted-foreground block">Customer Information</label>
                
                <input 
                  type="text" 
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                
                <input 
                  type="email" 
                  placeholder="Customer Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                
                <input 
                  type="text" 
                  placeholder="Order # from WePrintWraps.com (optional)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Action Button */}
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90 text-white text-sm font-semibold"
                onClick={() => navigate("/mighty-customer")}
              >
                + Add to Quote
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: DesignVault Premium Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold font-poppins">
                <span className="text-foreground">Design</span>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Vault</span>
                <span className="text-muted-foreground text-sm align-super">™</span>
              </CardTitle>
              <Database className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI-powered design library & visualization
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Latest Designs Carousel */}
              <div className="relative h-56 sm:h-64 md:h-72 bg-background rounded-lg border border-border overflow-hidden mb-3 group">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Car className="w-12 h-12 text-muted-foreground mx-auto animate-pulse" />
                      <p className="text-sm text-muted-foreground">Loading designs...</p>
                    </div>
                  </div>
                ) : latestDesigns.length > 0 ? (
                  <>
                    {/* Carousel Image */}
                    <div className="absolute inset-0 bg-muted/5 flex items-center justify-center">
                      {(() => {
                        const design = latestDesigns[carouselIndex];
                        const renderUrls = design?.render_urls;
                        let imageUrl = null;

                        if (Array.isArray(renderUrls) && renderUrls.length > 0) {
                          // Handle array format
                          imageUrl = renderUrls[0];
                        } else if (renderUrls && typeof renderUrls === 'object') {
                          // Handle object format - check multiple possible keys
                          imageUrl = (renderUrls as any).hero_angle || (renderUrls as any).hero || (renderUrls as any).front;
                        }

                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${design.vehicle_make} ${design.vehicle_model}`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              console.error('Image failed to load:', imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Car className="w-12 h-12 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">No preview available</p>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    
                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs font-semibold text-foreground">
                        {latestDesigns[carouselIndex]?.vehicle_make} {latestDesigns[carouselIndex]?.vehicle_model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {latestDesigns[carouselIndex]?.color_name || "Custom Color"}
                      </p>
                    </div>
                    
                    {/* Navigation Buttons */}
                    {latestDesigns.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm border border-border rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
                        >
                          <ChevronLeft className="w-4 h-4 text-foreground" />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm border border-border rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
                        >
                          <ChevronRight className="w-4 h-4 text-foreground" />
                        </button>
                        
                        {/* Dots Indicator */}
                        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {latestDesigns.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCarouselIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === carouselIndex
                                  ? "bg-primary w-4"
                                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Car className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">No designs yet</p>
                      <p className="text-xs text-muted-foreground/70">Start creating renders</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">Total Renders</div>
                  <div className="text-xs text-muted-foreground">All visualizations</div>
                </div>
                <div className="text-2xl font-bold text-gradient">1,284</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">Production Packs</div>
                  <div className="text-xs text-muted-foreground">Ready to print</div>
                </div>
                <div className="text-2xl font-bold text-gradient">847</div>
              </div>
              <Button 
                onClick={() => navigate("/designvault")}
                className="w-full bg-gradient-magenta-blue hover:opacity-90 text-white"
              >
                Open DesignVault
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ShopFlow Production Hub Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold font-poppins">
                <span className="text-foreground">Shop</span>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Flow</span>
                <span className="text-muted-foreground text-sm align-super">™</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Active jobs and workflow management
              </p>
            </div>
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Active Orders Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {shopflowLoading ? "..." : shopflowOrders.filter(o => o.status === 'design_requested').length}
                </div>
              </div>
              <div className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {shopflowLoading ? "..." : shopflowOrders.filter(o => o.status === 'awaiting_feedback' || o.status === 'revision_sent').length}
                </div>
              </div>
              <div className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Ready</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {shopflowLoading ? "..." : shopflowOrders.filter(o => o.status === 'ready_for_print').length}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Orders
              </div>
              {shopflowLoading ? (
                <div className="p-4 bg-background rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                </div>
              ) : shopflowOrders.length === 0 ? (
                <div className="p-4 bg-background rounded-lg border border-border text-center">
                  <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shopflowOrders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/shopflow/${order.id}`)}
                      className="p-3 bg-background rounded-lg border border-border hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">#{order.order_number}</span>
                        <span className="text-xs text-muted-foreground">{order.product_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{order.customer_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'ready_for_print' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'design_requested' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View All Button */}
            <Button 
              onClick={() => navigate("/shopflow")}
              className="w-full bg-gradient-purple-magenta hover:opacity-90 text-white"
            >
              View All Orders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards Below */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.title}
              className="bg-card border-border p-3 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-green-400 font-medium">{metric.change}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{metric.title}</div>
              <div className="text-xl font-bold text-foreground">{metric.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-primary rounded-full"></span>
          Admin Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.name}
                onClick={() => navigate(module.route)}
                className="bg-card border-border p-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <Icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-foreground mb-1">{module.name}</div>
                <div className="text-xs text-muted-foreground">{module.subtitle}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-primary rounded-full"></span>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm p-2 bg-background rounded-md">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-muted-foreground">New render added:</span>
              <span className="text-foreground font-medium">2019 Tesla Model 3 - Satin Flip</span>
              <span className="text-muted-foreground ml-auto text-xs">2m ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm p-2 bg-background rounded-md">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-muted-foreground">Approval received:</span>
              <span className="text-foreground font-medium">Order #32995</span>
              <span className="text-muted-foreground ml-auto text-xs">1h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm p-2 bg-background rounded-md">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-muted-foreground">Production pack ready:</span>
              <span className="text-foreground font-medium">Cybertruck Wrap Kit</span>
              <span className="text-muted-foreground ml-auto text-xs">3h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
