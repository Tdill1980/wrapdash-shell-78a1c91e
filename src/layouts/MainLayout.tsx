import React, { ReactNode } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Sidebar } from "@/components/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  userName?: string;
}

export const MainLayout = ({ children, userName = "User" }: MainLayoutProps) => {
  return (
    <div className="w-full h-screen flex overflow-hidden">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0B0D11] border-r border-white/10 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </aside>

      {/* PAGE AREA */}
      <div className="flex flex-col flex-1 ml-64 h-screen overflow-y-auto">

        {/* TOP HEADER */}
        <GlobalHeader userName={userName} />

        {/* PAGE BODY */}
        <div className="flex-1 pr-10 py-8 bg-[#0D0F12]">
          <div className="w-full space-y-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
