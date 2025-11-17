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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDesignVault } from "@/modules/designvault/hooks/useDesignVault";
import { useState } from "react";

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
              <CardTitle className="text-lg font-bold text-gradient">Quote Builder</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quick order & quote creation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Service Type */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Service Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-gradient-purple-magenta text-white text-xs py-2 px-3 rounded-md hover:opacity-90 transition-opacity">
                    Full Wrap
                  </button>
                  <button className="bg-background border border-border text-foreground text-xs py-2 px-3 rounded-md hover:bg-background/70 transition-colors">
                    Partial
                  </button>
                  <button className="bg-background border border-border text-foreground text-xs py-2 px-3 rounded-md hover:bg-background/70 transition-colors">
                    PPF
                  </button>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Year"
                  className="bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input 
                  type="text" 
                  placeholder="Make"
                  className="bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input 
                  type="text" 
                  placeholder="Model"
                  className="bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Customer Name */}
              <input 
                type="text" 
                placeholder="Customer Name"
                className="w-full bg-background border border-border text-xs px-3 py-2 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Estimated Price */}
              <div className="bg-background rounded-lg p-3 border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Estimated Price</span>
                <span className="text-xl font-bold text-gradient">$3,500</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="bg-gradient-magenta-blue hover:opacity-90 text-white text-xs font-semibold"
                  onClick={() => navigate("/mighty-customer")}
                >
                  Full Builder
                </Button>
                <Button 
                  className="bg-gradient-primary hover:opacity-90 text-white text-xs font-semibold"
                >
                  Send Quote
                </Button>
              </div>
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
