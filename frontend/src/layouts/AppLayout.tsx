import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";

export interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showSidebar = true,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex w-full">
        {showSidebar && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]"
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 pb-16">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
