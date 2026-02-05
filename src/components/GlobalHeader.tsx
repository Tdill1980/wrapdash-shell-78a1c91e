import React, { useEffect, useMemo, useState } from "react";
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
import { LogOut, User, Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { AskAgentButton } from "@/components/mightychat/AskAgentButton";
import { useOrganization } from "@/contexts/OrganizationContext";

interface GlobalHeaderProps {
  userName?: string;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const GlobalHeader = ({ userName = "User", onMobileMenuToggle, isMobileMenuOpen }: GlobalHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const { organizationSettings } = useOrganization();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      setEmail(session?.user?.email ?? null);
      // Get first name from user metadata (set during signup)
      const userFirstName = session?.user?.user_metadata?.first_name;
      setFirstName(userFirstName ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(!!data.session);
      setEmail(data.session?.user?.email ?? null);
      const userFirstName = data.session?.user?.user_metadata?.first_name;
      setFirstName(userFirstName ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Display name: prefer first name, then email username, then fallback
  const displayName = useMemo(() => {
    if (firstName) return firstName;
    if (email) return email.split("@")[0];
    return userName;
  }, [firstName, email, userName]);

  // Organization name for display
  const orgName = organizationSettings?.name || null;

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
          {isSignedIn ? (
            <>
              <AskAgentButton 
                variant="ghost" 
                size="sm"
                className="hidden sm:flex text-white/80 hover:text-white hover:bg-white/10"
              />
              <OrganizationSwitcher />
              <OfflineIndicator />

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none">
                  <div className="hidden sm:flex flex-col items-end">
                    {orgName && (
                      <span className="text-xs text-white/50 font-medium">{orgName}</span>
                    )}
                    <span className="text-sm">Hi, {displayName}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full border border-white/20 bg-gradient-to-br from-[#2F81F7] to-[#15D1FF] flex items-center justify-center text-white font-semibold text-sm hover:border-white/40 transition-all">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1A1D24] border-white/10 z-[100]">
                  <DropdownMenuLabel className="text-white/90">
                    {orgName || "My Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => navigate("/admin/settings")}
                    className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
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
            </>
          ) : (
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      {/* Thin gradient accent bar */}
      <div className="w-full h-[3px] bg-gradient-to-r from-[#2F81F7] to-[#15D1FF]" />
    </>
  );
};
