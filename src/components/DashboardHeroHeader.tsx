import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import broncoImage from "@/assets/rat-rod-bronco.png";

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

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 via-black/30 to-transparent">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-right-center opacity-80"
        style={{
          backgroundImage: `url(${broncoImage})`,
          backgroundPosition: 'right center',
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-30% via-background/30 to-60% to-transparent" />
      
      {/* Content Layer */}
      <div className="relative z-10 px-8 py-10">
        {/* Top Section - Title & Subtitle */}
        <div className="mb-6">
          <div className="inline-block bg-gradient-to-r from-black/80 via-black/60 to-black/40 px-4 py-3 rounded-lg mb-2">
            <h1 className="font-poppins text-4xl font-bold leading-tight mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              <span className="text-foreground">WrapCentral </span>
              <span className="text-gradient">Dashboard</span>
              <span className="text-muted-foreground text-2xl align-super">™</span>
            </h1>
            <p className="text-muted-foreground text-sm" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
              Your Command Center for Wrap Operations
            </p>
          </div>
          <p className="text-muted-foreground/60 text-xs" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
            {format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {/* Quick Wins Grid */}
        <div className="grid grid-cols-1 gap-3 max-w-xs">
          {quickWins.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-105 ${getVariantStyles(item.variant)}`}
              >
                <div className="flex flex-col items-start gap-2">
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-2xl font-bold font-poppins">
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
