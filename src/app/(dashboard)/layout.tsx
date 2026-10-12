"use client";

import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex relative overflow-x-hidden">
        {/* Responsive Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen w-full min-w-0 transition-all">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
