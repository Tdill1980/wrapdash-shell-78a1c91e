import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronLeft, ChevronRight, Car, Plus } from "lucide-react";
import { useDesignVault } from "../hooks/useDesignVault";

export function DashboardCardPreview() {
  const navigate = useNavigate();
  const { data: designs, isLoading } = useDesignVault({});
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const latestDesigns = useMemo(() => {
    return designs?.slice(0, 5) || [];
  }, [designs]);

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % latestDesigns.length);
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => 
      prev === 0 ? latestDesigns.length - 1 : prev - 1
    );
  };

  // Auto-play carousel
  useEffect(() => {
    if (latestDesigns.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [latestDesigns.length, isHovered, carouselIndex]);

  return (
    <Card className="bg-card border-0" style={{ boxShadow: '0 0 0 1px black' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold font-poppins">
              <span className="text-foreground">Design</span>
              <span className="bg-gradient-to-r from-[#E1306C] via-[#833AB4] to-[#405DE6] bg-clip-text text-transparent">Vault</span>
              <span className="text-muted-foreground text-sm align-super">™</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Dashboard Card Preview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/designvault/upload')}
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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
                      {latestDesigns[carouselIndex]?.vehicle_make === "Universal" 
                        ? "Universal Any Vehicle"
                        : `${latestDesigns[carouselIndex]?.vehicle_year || ''} ${latestDesigns[carouselIndex]?.vehicle_make} ${latestDesigns[carouselIndex]?.vehicle_model}`.trim()
                      }
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {latestDesigns[carouselIndex]?.color_name || 'Custom Color'}
                    {" · "}
                    {latestDesigns[carouselIndex]?.finish_type?.replace(/gloss/gi, '').trim() || 'N/A'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs"
                >
                  View on Dashboard →
                </Button>
              </div>
              
              {/* Tags */}
              {latestDesigns[carouselIndex]?.tags && latestDesigns[carouselIndex].tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {latestDesigns[carouselIndex].tags.slice(0, 5).map((tag: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-background border border-border"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {latestDesigns[carouselIndex].tags.length > 5 && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-background border border-border"
                    >
                      +{latestDesigns[carouselIndex].tags.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{designs?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Designs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {designs?.filter(d => d.vehicle_make === "Universal").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Universal</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {designs?.filter(d => d.vehicle_make !== "Universal").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Vehicle-Specific</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
