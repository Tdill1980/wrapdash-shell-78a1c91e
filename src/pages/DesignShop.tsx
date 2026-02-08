/**
 * Design + Print Shop
 * 
 * Browse stock designs → Select size → Order printing from WePrintWraps
 * Direct counter to Wrapstock's "Order Printing" play
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Filter, ShoppingCart, Eye, Download, 
  Sparkles, Printer, Package, ChevronRight, Star,
  Clock, Zap, Crown, ExternalLink, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/layouts/MainLayout";

// Brand colors
const MAGENTA = "#E91E8C";
const NEON_GRADIENT = "from-[#FF00FF] via-[#9D4EDD] to-[#2F81F7]";

interface StockDesign {
  id: string;
  design_name: string;
  design_description: string;
  preview_image_url: string;
  hero_render_url: string;
  files: Record<string, string>;
  panel_type: string;
  is_exclusive: boolean;
  tags: string[];
  download_count: number;
  price_design_only: number;
  price_with_print: Record<string, number>;
  category: string;
  designer_name: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Designs' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'racing', label: 'Racing' },
  { id: 'camo', label: 'Camo & Military' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'nature', label: 'Nature' },
  { id: 'graffiti', label: 'Graffiti & Urban' },
  { id: 'tribal', label: 'Tribal' },
  { id: 'commercial', label: 'Commercial Templates' },
];

const PANEL_SIZES = [
  { id: 'small', label: 'Small', desc: 'Up to 144"', sqft: '~50 sq ft' },
  { id: 'medium', label: 'Medium', desc: '145" - 180"', sqft: '~75 sq ft' },
  { id: 'large', label: 'Large', desc: '181" - 216"', sqft: '~100 sq ft' },
  { id: 'xl', label: 'XL', desc: '217"+', sqft: '~125 sq ft' },
];

// Mock data for demo
const MOCK_DESIGNS: StockDesign[] = [
  {
    id: '1',
    design_name: 'Dragon Blossom Fury',
    design_description: 'Japanese-inspired dragon with cherry blossoms on deep blue background',
    preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    hero_render_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
    files: { small: '#', medium: '#', large: '#', xl: '#' },
    panel_type: 'full_panel',
    is_exclusive: true,
    tags: ['japanese', 'dragon', 'colorful'],
    download_count: 247,
    price_design_only: 149,
    price_with_print: { small: 449, medium: 599, large: 749, xl: 899 },
    category: 'japanese',
    designer_name: 'WPW Design Team',
  },
  {
    id: '2',
    design_name: 'Midnight Camo',
    design_description: 'Stealth black and gray camouflage pattern',
    preview_image_url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800',
    hero_render_url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200',
    files: { small: '#', medium: '#', large: '#', xl: '#' },
    panel_type: 'full_panel',
    is_exclusive: false,
    tags: ['camo', 'stealth', 'dark'],
    download_count: 189,
    price_design_only: 99,
    price_with_print: { small: 399, medium: 549, large: 699, xl: 849 },
    category: 'camo',
    designer_name: 'WPW Design Team',
  },
  {
    id: '3',
    design_name: 'Neon Circuit',
    design_description: 'Cyberpunk-inspired circuit board pattern with neon accents',
    preview_image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    hero_render_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
    files: { small: '#', medium: '#', large: '#', xl: '#' },
    panel_type: 'full_panel',
    is_exclusive: true,
    tags: ['cyber', 'neon', 'tech'],
    download_count: 312,
    price_design_only: 179,
    price_with_print: { small: 479, medium: 629, large: 779, xl: 929 },
    category: 'geometric',
    designer_name: 'WPW Design Team',
  },
  {
    id: '4',
    design_name: 'Urban Graffiti Splash',
    design_description: 'Street art inspired colorful graffiti design',
    preview_image_url: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800',
    hero_render_url: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=1200',
    files: { small: '#', medium: '#', large: '#', xl: '#' },
    panel_type: 'full_panel',
    is_exclusive: false,
    tags: ['graffiti', 'urban', 'colorful'],
    download_count: 156,
    price_design_only: 129,
    price_with_print: { small: 429, medium: 579, large: 729, xl: 879 },
    category: 'graffiti',
    designer_name: 'WPW Design Team',
  },
];

export default function DesignShop() {
  const [designs, setDesigns] = useState<StockDesign[]>(MOCK_DESIGNS);
  const [filteredDesigns, setFilteredDesigns] = useState<StockDesign[]>(MOCK_DESIGNS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDesign, setSelectedDesign] = useState<StockDesign | null>(null);
  const [orderModal, setOrderModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [orderType, setOrderType] = useState<'design' | 'print'>('print');

  useEffect(() => {
    // Filter designs
    let filtered = designs;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(d => d.category === activeCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.design_name.toLowerCase().includes(query) ||
        d.design_description.toLowerCase().includes(query) ||
        d.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    setFilteredDesigns(filtered);
  }, [designs, activeCategory, searchQuery]);

  const handleOrderPrint = (design: StockDesign) => {
    setSelectedDesign(design);
    setOrderType('print');
    setOrderModal(true);
  };

  const handleDownloadDesign = (design: StockDesign) => {
    setSelectedDesign(design);
    setOrderType('design');
    setOrderModal(true);
  };

  const proceedToCheckout = () => {
    if (!selectedDesign || !selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }

    const price = orderType === 'print' 
      ? selectedDesign.price_with_print[selectedSize]
      : selectedDesign.price_design_only;

    // Build WooCommerce cart URL
    // This would link to WePrintWraps with the design pre-selected
    const checkoutUrl = `https://weprintwraps.com/checkout/?add-to-cart=DESIGN_PRODUCT_ID&design=${selectedDesign.id}&size=${selectedSize}`;
    
    toast({ 
      title: "Redirecting to checkout...", 
      description: `${selectedDesign.design_name} - ${selectedSize.toUpperCase()} - $${price}` 
    });
    
    // For now, just show success - in production, redirect to WooCommerce
    // window.location.href = checkoutUrl;
    setOrderModal(false);
  };

  const DesignCard = ({ design }: { design: StockDesign }) => (
    <Card className="group bg-black border border-fuchsia-500/20 rounded-xl overflow-hidden hover:border-fuchsia-500/50 transition-all">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a24]">
        <img 
          src={design.preview_image_url} 
          alt={design.design_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {design.is_exclusive && (
            <Badge className="bg-[#E91E8C] text-white border-0 text-[10px]">
              ✦ Exclusive
            </Badge>
          )}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20"
            onClick={() => setSelectedDesign(design)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
            onClick={() => handleOrderPrint(design)}
          >
            <Printer className="w-4 h-4 mr-1" />
            Order Print
          </Button>
        </div>

        {/* Downloads Count */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/70">
          <Download className="w-3 h-3 inline mr-1" />
          {design.download_count}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white text-sm mb-1 truncate">{design.design_name}</h3>
        <p className="text-white/50 text-xs mb-3 line-clamp-2">{design.design_description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {design.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-300 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/40 uppercase">Design Only</p>
            <p className="text-white font-bold">${design.price_design_only}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase">With Print</p>
            <p className="text-fuchsia-400 font-bold">from ${design.price_with_print.small}</p>
          </div>
        </div>

        {/* CTA */}
        <Button 
          className="w-full mt-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:opacity-90"
          onClick={() => handleOrderPrint(design)}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Order Print
        </Button>
      </div>
    </Card>
  );

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="relative py-8 px-6 rounded-2xl bg-gradient-to-br from-black via-fuchsia-950/30 to-black border border-fuchsia-500/30 overflow-hidden">
          <div className="relative z-10">
            <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              NEW: Design + Print Shop
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              <span className="text-white">Premium Wrap </span>
              <span className={`bg-gradient-to-r ${NEON_GRADIENT} bg-clip-text text-transparent`}>Designs</span>
            </h1>
            
            <p className="text-white/60 max-w-xl mb-6">
              Browse our curated library of print-ready wrap designs. 
              Buy the design file or order it printed and shipped on premium 3M vinyl.
            </p>

            {/* Value Props */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Print-ready files
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                3M & Avery materials
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Fast turnaround
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Free shipping over $500
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black border-white/10 text-white"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={activeCategory === cat.id 
                  ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 border-0" 
                  : "border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-white/50 text-sm">
            {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''} found
          </p>
          <Select defaultValue="popular">
            <SelectTrigger className="w-40 bg-black border-white/10 text-white text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Design Grid */}
        {filteredDesigns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDesigns.map(design => (
              <DesignCard key={design.id} design={design} />
            ))}
          </div>
        ) : (
          <Card className="bg-black/50 border border-white/10 p-12 text-center">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No designs found</h3>
            <p className="text-white/50 text-sm">Try adjusting your search or filters</p>
          </Card>
        )}

        {/* Order Modal */}
        <Dialog open={orderModal} onOpenChange={setOrderModal}>
          <DialogContent className="bg-[#0a0a0f] border border-fuchsia-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                {orderType === 'print' ? (
                  <>
                    <Printer className="w-5 h-5 text-fuchsia-400" />
                    Order Print
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-fuchsia-400" />
                    Download Design
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-white/60">
                {selectedDesign?.design_name}
              </DialogDescription>
            </DialogHeader>

            {selectedDesign && (
              <div className="space-y-4 mt-4">
                {/* Preview */}
                <div className="aspect-video rounded-lg overflow-hidden bg-[#1a1a24]">
                  <img 
                    src={selectedDesign.hero_render_url} 
                    alt={selectedDesign.design_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Order Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={orderType === 'print' ? 'default' : 'outline'}
                    className={orderType === 'print' ? 'flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-500' : 'flex-1 border-white/20 text-white'}
                    onClick={() => setOrderType('print')}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Order Print
                  </Button>
                  <Button
                    variant={orderType === 'design' ? 'default' : 'outline'}
                    className={orderType === 'design' ? 'flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-500' : 'flex-1 border-white/20 text-white'}
                    onClick={() => setOrderType('design')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Design Only
                  </Button>
                </div>

                {/* Size Selector */}
                <div>
                  <p className="text-white/70 text-sm mb-2">Select Panel Size</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PANEL_SIZES.map(size => {
                      const price = orderType === 'print' 
                        ? selectedDesign.price_with_print[size.id]
                        : selectedDesign.price_design_only;
                      
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedSize === size.id
                              ? 'border-fuchsia-500 bg-fuchsia-500/10'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium">{size.label}</p>
                              <p className="text-white/40 text-xs">{size.desc}</p>
                            </div>
                            <p className="text-fuchsia-400 font-bold">
                              ${orderType === 'print' ? selectedDesign.price_with_print[size.id] : selectedDesign.price_design_only}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* What's Included */}
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white font-medium text-sm mb-2">What's Included:</p>
                  <ul className="space-y-1">
                    {orderType === 'print' ? (
                      <>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          Print-ready design files (TIFF, PDF)
                        </li>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          Printed on premium 3M vinyl
                        </li>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          Laminated for protection
                        </li>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          Shipped to your door
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          High-res design files (TIFF, PDF, AI)
                        </li>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          All panel sizes included
                        </li>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          Commercial license
                        </li>
                        <li className="text-white/70 text-xs flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-400" />
                          Instant download
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* CTA */}
                <Button
                  onClick={proceedToCheckout}
                  disabled={!selectedSize}
                  className="w-full h-12 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-semibold text-lg"
                >
                  {orderType === 'print' ? (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart — ${selectedSize ? selectedDesign.price_with_print[selectedSize] : '---'}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Buy Design — ${selectedDesign.price_design_only}
                    </>
                  )}
                </Button>

                {/* RestylePro CTA */}
                <div className="text-center pt-2 border-t border-white/10">
                  <p className="text-white/40 text-xs mb-2">Want to see it on your vehicle first?</p>
                  <Button
                    variant="link"
                    className="text-fuchsia-400 text-xs p-0 h-auto"
                    onClick={() => window.open('https://restyleproai.com', '_blank')}
                  >
                    Try RestyleProAI — Free 3D Mockup
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/30 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Don't see what you need?</h3>
              <p className="text-white/60 text-sm">Create your own custom wrap with AI or work with our design team.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-white/20 text-white"
                onClick={() => window.location.href = '/designproai'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Designer
              </Button>
              <Button 
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
                onClick={() => window.location.href = 'https://weprintwraps.com/custom-design'}
              >
                Custom Design
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 text-white/30 text-xs">
          Powered by <span className="text-fuchsia-400">WrapCommand™</span> • 
          Print partner: <span className="text-white/50">WePrintWraps.com</span>
        </div>
      </div>
    </MainLayout>
  );
}
