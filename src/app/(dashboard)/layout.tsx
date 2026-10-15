"use client";

import Sidebar from "@/components/Sidebar";
import MobileTabBar from "@/components/MobileTabBar";
import { SidebarProvider } from "@/components/SidebarContext";
import { UploadQueueProvider } from "@/components/UploadQueueContext";
import FileUploadModal from "@/components/FileUploadModal";
import UploadProgressPill from "@/components/UploadProgressPill";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UploadQueueProvider>
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex relative overflow-x-hidden">
          {/* Responsive Left Sidebar (drawer on mobile, fixed on desktop) */}
          <Sidebar />

          {/* Main Content Area — bottom padding clears the mobile tab bar */}
          <div className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen w-full min-w-0 transition-all pb-20 lg:pb-0">
            {children}
          </div>

          {/* Mobile bottom tab navigation */}
          <MobileTabBar />

          {/* App-level upload queue: one persistent dialog + floating pill.
              Uploads survive modal close and page navigation. */}
          <FileUploadModal />
          <UploadProgressPill />
        </div>
      </UploadQueueProvider>
    </SidebarProvider>
  );
}
