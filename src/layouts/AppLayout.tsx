import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MobileDrawer } from "@/components/MobileDrawer";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background w-full flex">
      <Sidebar />
      <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col w-full min-w-0">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
