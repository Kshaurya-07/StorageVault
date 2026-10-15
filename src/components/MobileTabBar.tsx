"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";

/** Bottom tab bar for mobile (lg:hidden). The center Upload action dispatches
 *  a `vault:open-upload` event that the dashboard Header listens for and opens
 *  the shared FileUploadModal — no prop drilling needed. */
export default function MobileTabBar() {
  const pathname = usePathname();

  const isFilesActive =
    pathname === "/files" || pathname.startsWith("/files/");

  const tabs = [
    {
      label: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Files",
      href: "/files",
      icon: FolderOpen,
      active: isFilesActive,
    },
    {
      label: "AI Search",
      href: "/ai-search",
      icon: Sparkles,
      active: pathname === "/ai-search",
    },
    {
      label: "Saved",
      href: "/favorites",
      icon: Star,
      active: pathname === "/favorites",
    },
  ];

  const openUpload = () => {
    window.dispatchEvent(new CustomEvent("vault:open-upload"));
  };

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0a0a0a]/95 backdrop-blur-md safe-area-bottom"
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-[64px] transition ${
                tab.active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
              aria-current={tab.active ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.active && (
                <span className="w-1 h-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}

        {/* Center upload action — 56px target, raised */}
        <div className="flex items-start justify-center">
          <button
            onClick={openUpload}
            aria-label="Upload file"
            className="w-14 h-14 -mt-5 rounded-2xl bg-white hover:bg-neutral-200 active:scale-95 text-black shadow-lg shadow-black/60 flex items-center justify-center transition border border-white/20"
          >
            <Upload className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-[64px] transition ${
                tab.active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
              aria-current={tab.active ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.active && (
                <span className="w-1 h-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
