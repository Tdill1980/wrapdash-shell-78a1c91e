import { Menu, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import wrapCommandLogo from "@/assets/wrapcommand-logo-new.png";

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-5 sticky top-0 z-50 relative">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-primary opacity-60"></div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={onMenuClick}
        >
          <Menu className="w-4 h-4" />
        </Button>
        
        <div className="hidden sm:block">
          <img 
            src={wrapCommandLogo} 
            alt="WrapCommand AI - Command Your Wrap Brand" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <OfflineIndicator />
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 hover:bg-card"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full shadow-glow" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-card"
        >
          <Settings className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
};
