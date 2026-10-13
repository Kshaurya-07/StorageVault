"use client";

import Sidebar from "@/components/Sidebar";
import MobileTabBar from "@/components/MobileTabBar";
import { SidebarProvider } from "@/components/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-ink-900 text-neutral-100 flex relative overflow-x-hidden">
        {/* Responsive Left Sidebar (drawer on mobile, fixed on desktop) */}
        <Sidebar />

        {/* Main Content Area — bottom padding clears the mobile tab bar */}
        <div className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen w-full min-w-0 transition-all pb-20 lg:pb-0">
          {children}
        </div>

        {/* Mobile bottom tab navigation */}
        <MobileTabBar />
      </div>
    </SidebarProvider>
  );
}
