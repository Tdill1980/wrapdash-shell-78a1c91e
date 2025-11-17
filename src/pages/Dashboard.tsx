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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDesignVault } from "@/modules/designvault/hooks/useDesignVault";
import { useState } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

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
    name: "Admin Panel",
    subtitle: "Full admin access",
    icon: Settings,
    route: "/settings",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: designs, isLoading } = useDesignVault();
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
  
  // Pricing calculation
  const productPricing: { [key: string]: number } = {
    "Full Wrap": 3500,
    "Partial Wrap": 1800,
    "Chrome Delete": 800,
    "Color Change Film": 2800,
    "Printed Wrap Film": 3200,
    "PPF (Paint Protection Film)": 2500,
    "Window Tint": 600,
    "Window Perf": 1200,
    "Full Window Perf": 1200,
    "Rear Window Perf": 500,
    "Side Window Perf": 800,
    "Custom Window Perf": 1500,
  };
  
  const basePrice = productPricing[product] || 0;
  const subtotal = basePrice * quantity;
  const installFee = subtotal * 0.15; // 15% install fee
  const taxRate = 0.08; // 8% tax
  const taxAmount = (subtotal + installFee) * taxRate;
  const totalCost = subtotal + installFee + taxAmount;
  
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
    
    // Parse product type
    if (lowerTranscript.includes("full wrap")) setProduct("Full Wrap");
    else if (lowerTranscript.includes("partial wrap")) setProduct("Partial Wrap");
    else if (lowerTranscript.includes("chrome delete")) setProduct("Chrome Delete");
    else if (lowerTranscript.includes("color change")) setProduct("Color Change Film");
    else if (lowerTranscript.includes("printed wrap")) setProduct("Printed Wrap Film");
    else if (lowerTranscript.includes("window perf")) setProduct("Window Perf");
    else if (lowerTranscript.includes("ppf") || lowerTranscript.includes("paint protection")) setProduct("PPF (Paint Protection Film)");
    else if (lowerTranscript.includes("window tint") || lowerTranscript.includes("tint")) setProduct("Window Tint");
    
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
      {/* VoiceCommand Bar - Sticky at top */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">VoiceCommand</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              ACTIVE
            </Badge>
          </div>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90 h-8 text-white">
            Start Recording
          </Button>
        </div>
      </div>

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
                <CardTitle className="text-lg font-bold text-gradient">MightyCustomer</CardTitle>
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
                  title={isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Hold to Speak'}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Product Quick Select Buttons */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Quick Select Product</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Color Change Film' ? 'default' : 'outline'}
                    onClick={() => setProduct('Color Change Film')}
                    className="text-xs py-1 h-auto"
                  >
                    Color Change Film
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Printed Wrap Film' ? 'default' : 'outline'}
                    onClick={() => setProduct('Printed Wrap Film')}
                    className="text-xs py-1 h-auto"
                  >
                    Printed Wrap
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Window Perf' ? 'default' : 'outline'}
                    onClick={() => setProduct('Window Perf')}
                    className="text-xs py-1 h-auto"
                  >
                    Window Perf
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'Window Tint' ? 'default' : 'outline'}
                    onClick={() => setProduct('Window Tint')}
                    className="text-xs py-1 h-auto"
                  >
                    Tint
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={product === 'PPF (Paint Protection Film)' ? 'default' : 'outline'}
                    onClick={() => setProduct('PPF (Paint Protection Film)')}
                    className="text-xs py-1 h-auto"
                  >
                    PPF
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

              {/* Product Category Buttons */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Or Browse by Category</label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'weprintwraps' ? 'default' : 'outline'}
                    onClick={() => {
                      setProductCategory('weprintwraps');
                      setProduct('');
                    }}
                    className="flex-1 text-xs"
                  >
                    WePrintWraps.com Products
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={productCategory === 'window-perf' ? 'default' : 'outline'}
                    onClick={() => {
                      setProductCategory('window-perf');
                      setProduct('');
                    }}
                    className="flex-1 text-xs"
                  >
                    Window Perf
                  </Button>
                </div>
                
                {/* Product Dropdown - Changes based on category */}
                <select 
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary z-50"
                >
                  <option value="">Choose a Product</option>
                  {productCategory === 'weprintwraps' ? (
                    <>
                      <option value="Full Wrap">Full Wrap</option>
                      <option value="Partial Wrap">Partial Wrap</option>
                      <option value="Chrome Delete">Chrome Delete</option>
                      <option value="Color Change Film">Color Change Film</option>
                      <option value="Printed Wrap Film">Printed Wrap Film</option>
                      <option value="PPF (Paint Protection Film)">PPF (Paint Protection Film)</option>
                      <option value="Window Tint">Window Tint</option>
                    </>
                  ) : (
                    <>
                      <option value="Full Window Perf">Full Window Perf</option>
                      <option value="Rear Window Perf">Rear Window Perf</option>
                      <option value="Side Window Perf">Side Window Perf</option>
                      <option value="Custom Window Perf">Custom Window Perf</option>
                      <option value="Window Perf">Window Perf</option>
                    </>
                  )}
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
                    <input
                      type="text"
                      placeholder="Year"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Make"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Model"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Quantity and Finish */}
              <div className="grid grid-cols-2 gap-2">
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
                  <span className="text-muted-foreground">Product ({quantity}x)</span>
                  <span className="text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Install (15%)</span>
                  <span className="text-foreground">${installFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="text-foreground">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-gradient">${totalCost.toFixed(2)}</span>
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
              <CardTitle className="text-lg font-bold text-gradient">DesignVault Premium</CardTitle>
              <Database className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI-powered design library & visualization
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Latest Designs Carousel */}
              <div className="relative h-48 bg-background rounded-lg border border-border overflow-hidden mb-3 group">
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
                    <div className="absolute inset-0">
                      {latestDesigns[carouselIndex]?.render_urls && 
                       typeof latestDesigns[carouselIndex].render_urls === 'object' && 
                       'hero_angle' in (latestDesigns[carouselIndex].render_urls as any) ? (
                        <img
                          src={(latestDesigns[carouselIndex].render_urls as any).hero_angle}
                          alt={`${latestDesigns[carouselIndex].vehicle_make} ${latestDesigns[carouselIndex].vehicle_model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
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
