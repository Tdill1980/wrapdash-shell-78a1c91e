import React, { ReactNode } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Sidebar } from "@/components/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  userName?: string;
}

export const MainLayout = ({ children, userName = "User" }: MainLayoutProps) => {
  return (
    <div className="flex w-full min-h-screen page-dark">
      {/* FIXED LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0B0D11] border-r border-white/10 fixed top-0 left-0 bottom-0 z-50 overflow-y-auto">
        <Sidebar />
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <GlobalHeader userName={userName} />
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
};
