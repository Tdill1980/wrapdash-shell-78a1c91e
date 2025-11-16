import { Menu, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  return (
    <header className="h-14 border-b border-white/[0.05] bg-background/95 backdrop-blur-sm flex items-center justify-between px-5 sticky top-0 z-50">
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
          <p className="text-xs text-muted-foreground">Welcome back</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Settings className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
};
