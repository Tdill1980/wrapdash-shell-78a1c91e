import React, { ReactNode, useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Sidebar } from "@/components/Sidebar";
import { LuigiWebsiteWidget } from "@/components/chat/LuigiWebsiteWidget";
import { SOPHelpPanel } from "@/components/SOPHelpPanel";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

interface MainLayoutProps {
  children: ReactNode;
  userName?: string;
}

export const MainLayout = ({ children, userName = "User" }: MainLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen page-dark">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* FIXED LEFT SIDEBAR - Hidden on mobile, slides in when menu open */}
      <aside className={`
        w-64 bg-[#0B0D11] border-r border-white/10 fixed top-0 bottom-0 z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:left-0
      `}>
        <Sidebar onMobileClose={() => setMobileMenuOpen(false)} />
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-1 min-h-0 flex flex-col w-full lg:ml-64">
        <GlobalHeader 
          userName={userName} 
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobileMenuOpen={mobileMenuOpen}
        />
        {/* Breadcrumb Navigation */}
        <AppBreadcrumb />
        <div className="flex-1 min-h-0 p-4 sm:p-6">{children}</div>
      </main>

      {/* Luigi Chat Widget - Floating on all pages */}
      <LuigiWebsiteWidget />

      {/* SOP Help Panel - Floating help button */}
      <SOPHelpPanel />
    </div>
  );
};

