import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/OfflineIndicator";

interface GlobalHeaderProps {
  userName?: string;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const GlobalHeader = ({ userName = "User", onMobileMenuToggle, isMobileMenuOpen }: GlobalHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    }
  };

  return (
    <>
      <header className="w-full bg-[#0D0F12] px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-white hover:bg-white/10"
          onClick={onMobileMenuToggle}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>

        {/* WrapCommandAI™ Wordmark */}
        <h1 className="text-base sm:text-xl font-extrabold font-['Poppins'] tracking-wide">
          <span className="text-white">Wrap</span>
          <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
            Command
          </span>
          <span className="text-cyan-300">AI™</span>
        </h1>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none">
              <span className="hidden sm:inline">Hi, {userName}</span>
              <div className="h-8 w-8 rounded-full border border-white/20 bg-gradient-to-br from-[#2F81F7] to-[#15D1FF] flex items-center justify-center text-white font-semibold text-sm hover:border-white/40 transition-all">
                {userName.charAt(0).toUpperCase()}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1A1D24] border-white/10 z-[100]">
              <DropdownMenuLabel className="text-white/90">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => navigate("/settings")}
                className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Thin gradient accent bar */}
      <div className="w-full h-[3px] bg-gradient-to-r from-[#2F81F7] to-[#15D1FF]" />
    </>
  );
};
