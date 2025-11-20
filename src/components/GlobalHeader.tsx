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
import { Settings, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

interface GlobalHeaderProps {
  userName?: string;
}

export const GlobalHeader = ({ userName = "User" }: GlobalHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className="w-full bg-[#0D0F12] px-8 py-4 flex items-center justify-between border-b border-white/10">
        {/* WrapCommandAI™ Wordmark */}
        <h1 className="text-xl font-extrabold font-['Poppins'] tracking-wide">
          <span className="text-white">Wrap</span>
          <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
            Command
          </span>
          <span className="text-cyan-300">AI™</span>
        </h1>

        {/* Right-side user profile dropdown */}
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
            <DropdownMenuItem 
              onClick={toggleTheme}
              className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>Toggle Theme</span>
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
      </header>

      {/* Thin gradient accent bar */}
      <div className="w-full h-[3px] bg-gradient-to-r from-[#2F81F7] to-[#15D1FF]" />
    </>
  );
};
