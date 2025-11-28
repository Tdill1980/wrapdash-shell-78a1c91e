import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import broncoImage from "@/assets/rat-rod-bronco.png";
import { useDashboardHeroImages } from "@/hooks/useDashboardHeroImages";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface QuickWinCard {
  icon: React.ElementType;
  count: number;
  label: string;
  route: string;
  variant: 'primary' | 'success' | 'warning' | 'info';
}

interface DashboardHeroHeaderProps {
  activeRendersCount: number;
}

export function DashboardHeroHeader({
  activeRendersCount,
}: DashboardHeroHeaderProps) {
  const navigate = useNavigate();
  const { images, loading } = useDashboardHeroImages();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Determine current time of day
  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  };

  // Filter images by time of day
  const getFilteredImages = () => {
    const timeOfDay = getCurrentTimeOfDay();
    const filtered = images.filter(
      img => img.time_of_day === 'all' || img.time_of_day === timeOfDay
    );
    return filtered.length > 0 ? filtered : images;
  };

  const displayImages = getFilteredImages();
  const currentImage = displayImages[currentImageIndex] || null;
  const backgroundImage = currentImage?.image_url || broncoImage;
  const heroTitle = currentImage?.title || "WrapCentral";
  const heroSubtitle = currentImage?.subtitle || "Your Command Center for Wrap Operations";

  const quickWins: QuickWinCard[] = [
    {
      icon: Clock,
      count: activeRendersCount,
      label: "Active Renders",
      route: "/admin/designvault",
      variant: 'info',
    },
  ];

  const getVariantStyles = (variant: QuickWinCard['variant']) => {
    switch (variant) {
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400';
      case 'primary':
        return 'bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-64 overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Single image or no carousel needed
  if (displayImages.length <= 1) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 via-black/30 to-transparent">
        {/* Background Image Layer */}
              <div 
                className="absolute inset-0 bg-cover opacity-80"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundPosition: window.innerWidth < 768 
                    ? (currentImage?.background_position_mobile || 'center')
                    : (currentImage?.background_position_desktop || 'center'),
                }}
              />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-30% via-background/30 to-60% to-transparent" />
        
        {/* Content Layer */}
        <div className="relative z-10 px-4 sm:px-8 pt-4 pb-6 sm:pt-6 sm:pb-10">
          <div className="mb-4 sm:mb-6">
            <div className="inline-block bg-gradient-to-r from-black/80 via-black/60 to-black/40 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-2">
              <h1 className="font-poppins text-2xl sm:text-4xl font-bold leading-tight mb-0.5" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                <span className="text-foreground">{heroTitle} </span>
                <span className="text-gradient">Dashboard</span>
                <span className="text-muted-foreground text-lg sm:text-2xl align-super">™</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                {heroSubtitle}
              </p>
            </div>
            <p className="text-muted-foreground/60 text-xs hidden sm:block" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
              {format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-w-xs">
            {quickWins.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.route)}
                  className={`group relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:scale-105 ${getVariantStyles(item.variant)}`}
                >
                  <div className="flex flex-col items-start gap-2">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <div className="text-left">
                      <div className="text-xl sm:text-2xl font-bold font-poppins">
                        {item.count}
                      </div>
                      <div className="text-xs font-medium opacity-80">
                        {item.label}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Multiple images - carousel mode
  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[Autoplay({ delay: 5000 })]}
      className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/10"
    >
      <CarouselContent>
        {displayImages.map((image, index) => (
          <CarouselItem key={image.id}>
            <div className="relative w-full bg-gradient-to-r from-black/60 via-black/30 to-transparent">
              {/* Background Image Layer */}
              <div 
                className="absolute inset-0 bg-cover opacity-80"
                style={{
                  backgroundImage: `url(${image.image_url})`,
                  backgroundPosition: window.innerWidth < 768 
                    ? (image.background_position_mobile || 'center')
                    : (image.background_position_desktop || 'center'),
                }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-30% via-background/30 to-60% to-transparent" />
              
              {/* Content Layer */}
              <div className="relative z-10 px-4 sm:px-8 pt-4 pb-6 sm:pt-6 sm:pb-10">
                <div className="mb-4 sm:mb-6">
                  <div className="inline-block bg-gradient-to-r from-black/80 via-black/60 to-black/40 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-2">
                    <h1 className="font-poppins text-2xl sm:text-4xl font-bold leading-tight mb-0.5" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      <span className="text-foreground">{image.title || "WrapCentral"} </span>
                      <span className="text-gradient">Dashboard</span>
                      <span className="text-muted-foreground text-lg sm:text-2xl align-super">™</span>
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                      {image.subtitle || "Your Command Center for Wrap Operations"}
                    </p>
                  </div>
                  <p className="text-muted-foreground/60 text-xs hidden sm:block" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                    {format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-w-xs">
                  {quickWins.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => navigate(item.route)}
                        className={`group relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:scale-105 ${getVariantStyles(item.variant)}`}
                      >
                        <div className="flex flex-col items-start gap-2">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <div className="text-left">
                            <div className="text-xl sm:text-2xl font-bold font-poppins">
                              {item.count}
                            </div>
                            <div className="text-xs font-medium opacity-80">
                              {item.label}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}
