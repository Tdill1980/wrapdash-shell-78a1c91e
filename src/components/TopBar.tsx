import { Menu, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden sm:block">
          <p className="text-sm text-muted-foreground">Welcome back</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted/50"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-muted/50"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-purple flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
        </Button>
      </div>
    </header>
  );
};
