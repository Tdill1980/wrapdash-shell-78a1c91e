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
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDesignVault } from "@/modules/designvault/hooks/useDesignVault";
import { useState, useMemo, useEffect } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useProducts } from "@/hooks/useProducts";
import VoiceCommand from "@/components/VoiceCommand";
import { getVehicleMakes, getVehicleModels, getVehicleSQFTOptions } from "@/lib/vehicleSqft";
import { DashboardCardPreview } from "@/modules/designvault/components/DashboardCardPreview";
import { UTIMAnalyticsDashboard } from "@/components/UTIMAnalyticsDashboard";
import { ToneDesignPerformance } from "@/components/ToneDesignPerformance";
import { MainLayout } from "@/layouts/MainLayout";
import { DashboardHeroHeader } from "@/components/DashboardHeroHeader";
import { isWPW } from "@/lib/wpwProducts";

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
    name: "Design Vault Admin",
    subtitle: "Manage all designs",
    icon: Database,
    route: "/admin/designvault",
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
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput();
  
  // Quote Builder State
  const [productCategory, setProductCategory] = useState<'wrap' | 'ppf' | 'tint' | 'all' | 'wpw'>('all');
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
  
  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (productCategory === 'all') return products;
    if (productCategory === 'wpw') {
      return products.filter(p => isWPW(p.woo_product_id));
    }
    return products.filter(p => p.category === productCategory);
  }, [products, productCategory]);
  
  // Get vehicle data from helper functions
  const vehicleMakes = getVehicleMakes();
  
  // Auto-fill sq ft when vehicle is selected
  useEffect(() => {
    if (!vehicleYear || !vehicleMake || !vehicleModel) {
      return;
    }
    
    const options = getVehicleSQFTOptions(vehicleYear, vehicleMake, vehicleModel);
    
    if (options) {
      // Use the "Corrected Sq Foot" (with 10% for waste)
      setSqFt(options.withRoof);
      console.log(`✓ Auto-filled SQFT: ${options.withRoof} sq ft for ${vehicleYear} ${vehicleMake} ${vehicleModel}`);
    } else {
      console.log(`✗ No SQFT data found for: ${vehicleYear} ${vehicleMake} ${vehicleModel}`);
    }
  }, [vehicleYear, vehicleMake, vehicleModel]);
  
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

  // Auto-play carousel
  useEffect(() => {
    if (latestDesigns.length <= 1 || isCarouselHovered) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [latestDesigns.length, isCarouselHovered, carouselIndex]);
  
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

  // Calculate Quick Wins counts
  const awaitingApprovalCount = shopflowOrders?.filter(order => order.status === 'awaiting_approval').length || 0;
  const proofsReadyCount = shopflowOrders?.filter(order => order.approveflow_project_id).length || 0;
  const activeRendersCount = designs?.slice(0, 5).length || 0;
  const pendingActionsCount = shopflowOrders?.filter(order => order.status === 'pending' || order.status === 'order_received').length || 0;

  return (
    <MainLayout userName="Admin">
      <div className="w-full space-y-6">

      {/* Dashboard Hero Header */}
        <DashboardHeroHeader
          activeRendersCount={activeRendersCount}
        />

      {/* Two-Column Hero Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Quote Builder Card */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <div className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="font-poppins text-xl sm:text-2xl font-bold leading-tight">
                  <span className="text-foreground">Mighty</span>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Customer</span>
                  <span className="text-muted-foreground text-sm sm:text-lg align-super">™</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Quote & Order Builder
                </p>
              </div>
              <VoiceCommand onTranscript={(transcript) => parseAndFillForm(transcript)} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Category Filter Buttons */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Product Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'wpw' ? 'default' : 'outline'}
                    onClick={() => { setProductCategory('wpw'); setProduct(""); }}
                    className={`text-xs py-1 h-auto font-semibold ${
                      productCategory === 'wpw'
                        ? 'bg-gradient-to-r from-[#60A5FA] to-[#2563EB] hover:from-[#93C5FD] hover:to-[#3B82F6] text-white border-0 shadow-lg'
                        : ''
                    }`}
                  >
                    WePrintWraps.com
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => { setProductCategory('all'); setProduct(""); }}
                    className="text-xs py-1 h-auto"
                  >
                    All Products
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'wrap' ? 'default' : 'outline'}
                    onClick={() => { setProductCategory('wrap'); setProduct(""); }}
                    className="text-xs py-1 h-auto"
                  >
                    Wraps
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'ppf' ? 'default' : 'outline'}
                    onClick={() => { setProductCategory('ppf'); setProduct(""); }}
                    className="text-xs py-1 h-auto"
                  >
                    PPF
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'tint' ? 'default' : 'outline'}
                    onClick={() => { setProductCategory('tint'); setProduct(""); }}
                    className="text-xs py-1 h-auto"
                  >
                    Window Tint
                  </Button>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Select Product {productCategory !== 'all' && `(${productCategory.toUpperCase()})`}
                </label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose a product...</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.product_name}>
                      {p.product_name} - {p.pricing_type === 'per_sqft' ? `$${p.price_per_sqft}/sq ft` : `$${p.flat_price}`}
                    </option>
                  ))}
                </select>
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
                        {vehicleMakes.map((make: string) => (
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
                        {vehicleMake && getVehicleModels(vehicleMake).map((model: string) => (
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
                onClick={() => navigate("/mighty-customer", {
                  state: {
                    productCategory,
                    product,
                    vehicleMake,
                    vehicleModel,
                    vehicleYear,
                    quantity,
                    finish,
                    customerName,
                    customerEmail,
                    margin,
                    sqFt,
                    installHours,
                  }
                })}
              >
                + Start Building Quote
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: DesignVault Premium Card & UTIM Analytics */}
        <div className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dashboard-card-title text-lg font-bold font-poppins">
                    <span className="text-foreground">Design</span>
                    <span className="text-gradient">Vault</span>
                    <span className="text-muted-foreground text-sm align-super">™</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-powered design library & visualization
                  </p>
                </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/designvault/upload')}
                  className="bg-gradient-primary text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Upload
                </Button>
                <Database className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Latest Designs Carousel */}
              <div 
                className="relative h-56 sm:h-64 md:h-72 bg-background rounded-lg border border-border overflow-hidden mb-3 group"
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Car className="w-12 h-12 text-muted-foreground mx-auto animate-pulse" />
                      <p className="text-sm text-muted-foreground">Loading designs...</p>
                    </div>
                  </div>
                ) : latestDesigns.length > 0 ? (
                  <>
                    {/* Carousel Images with Slide Animation */}
                    <div className="absolute inset-0">
                      {latestDesigns.map((design, idx) => {
                        const renderUrls = design?.render_urls;
                        let imageUrl = null;

                        if (Array.isArray(renderUrls) && renderUrls.length > 0) {
                          imageUrl = renderUrls[0];
                        } else if (renderUrls && typeof renderUrls === 'object') {
                          imageUrl = (renderUrls as any).hero_angle || (renderUrls as any).hero || (renderUrls as any).front;
                        }

                        // Skip rendering if no image URL
                        if (!imageUrl) return null;

                        return (
                          <div
                            key={design.id}
                            className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
                            style={{
                              transform: `translateX(${(idx - carouselIndex) * 100}%)`,
                              opacity: idx === carouselIndex ? 1 : 0,
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={`${design.vehicle_make} ${design.vehicle_model}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                console.error('Image failed to load:', imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {/* Design Name Badge Overlay */}
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <Badge className="bg-background/95 backdrop-blur-sm border border-border text-foreground text-sm px-3 py-1.5 shadow-lg">
                                {design.color_name || design.design_file_name || "Custom Design"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Navigation Buttons */}
                    {latestDesigns.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-lg z-10"
                        >
                          <ChevronLeft className="w-4 h-4 text-foreground" />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-lg z-10"
                        >
                          <ChevronRight className="w-4 h-4 text-foreground" />
                        </button>
                        
                        {/* Dots Indicator */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {latestDesigns.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCarouselIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === carouselIndex
                                  ? "bg-primary w-4"
                                  : "bg-background/60 hover:bg-background/80"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Database className="w-12 h-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No designs yet</p>
                  </div>
                )}
              </div>
              
              {/* Info Bar with Tags */}
              {latestDesigns.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-black text-white border-black text-xs px-2 py-0.5">
                          Universal Any Vehicle
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {latestDesigns[carouselIndex]?.finish_type?.replace(/gloss/gi, '').trim()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/designvault')}
                      className="text-xs"
                    >
                      View All
                    </Button>
                  </div>
                  
                  {/* Tags */}
                  {latestDesigns[carouselIndex]?.tags && latestDesigns[carouselIndex].tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {latestDesigns[carouselIndex].tags.slice(0, 5).map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
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
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
              >
                Open DesignVault
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* UTIM Analytics Dashboard */}
        <UTIMAnalyticsDashboard />
        
        {/* Tone & Design Performance */}
        <ToneDesignPerformance />
      </div>
    </div>

      {/* ShopFlow Production Hub Card */}
      <Card className="dashboard-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dashboard-card-title text-lg font-bold font-poppins">
                <span className="text-foreground">Shop</span>
                <span className="text-gradient">Flow</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {shopflowLoading ? "..." : shopflowOrders.filter(o => o.status === 'design_requested').length}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {shopflowLoading ? "..." : shopflowOrders.filter(o => o.status === 'awaiting_feedback' || o.status === 'revision_sent').length}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-background rounded-lg border border-border col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Ready</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
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
                        <span className="text-sm font-semibold text-foreground">#{order.woo_order_number ?? order.order_number}</span>
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
              className="w-full bg-gradient-primary hover:opacity-90 text-white"
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
              className="dashboard-card p-3 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-green-400 font-medium">{metric.change}</span>
              </div>
              <div className="dashboard-card-title text-xs text-muted-foreground mb-1">{metric.title}</div>
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
                className="dashboard-card p-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <Icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="dashboard-card-title text-sm font-semibold text-foreground mb-1">{module.name}</div>
                <div className="text-xs text-muted-foreground">{module.subtitle}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="dashboard-card">
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
    </MainLayout>
  );
}
