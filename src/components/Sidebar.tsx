"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HardDrive,
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  Star,
  Clock,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Send,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import { FileCategory } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebar();
  const [tgStatus, setTgStatus] = useState<{
    connected: boolean;
    status: string;
    username?: string;
  }>({ connected: false, status: "DISCONNECTED" });

  useEffect(() => {
    fetch("/api/telegram/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setTgStatus(data);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "All Files", href: "/files", icon: FolderOpen },
    { label: "AI Search", href: "/ai-search", icon: Sparkles, badge: "AI" },
    { label: "Favorites", href: "/favorites", icon: Star },
    { label: "Recent Uploads", href: "/recent", icon: Clock },
    { label: "Storage Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const categoryItems: {
    label: string;
    href: string;
    icon: typeof FileText;
    category: FileCategory;
  }[] = [
    { label: "Documents", href: "/files/documents", icon: FileText, category: "DOCUMENT" },
    { label: "Images", href: "/files/images", icon: ImageIcon, category: "IMAGE" },
    { label: "Videos", href: "/files/videos", icon: Video, category: "VIDEO" },
    { label: "Audio", href: "/files/audio", icon: Music, category: "AUDIO" },
    { label: "Archives", href: "/files/archives", icon: Archive, category: "ARCHIVE" },
  ];

  const categoryIconClass: Record<FileCategory, string> = {
    DOCUMENT: "text-cat-document",
    IMAGE: "text-cat-image",
    VIDEO: "text-cat-video",
    AUDIO: "text-cat-audio",
    ARCHIVE: "text-cat-archive",
    OTHER: "text-cat-other",
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={`w-64 bg-ink-900 border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={close}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/40 flex items-center justify-center shadow-md">
              <HardDrive className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                Storage<span className="text-neutral-400 font-medium">Vault</span>
              </span>
              <span className="text-[9px] text-neutral-400 tracking-wider uppercase font-semibold">
                Sovereign Cloud
              </span>
            </div>
          </Link>

          <button
            onClick={close}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 pb-24 lg:pb-4">
        {/* Main Section */}
        <div>
          <div className="text-xs font-semibold text-neutral-500 px-3 mb-2 tracking-wider uppercase">
            Platform
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${
                    active
                      ? "bg-brand-500/15 text-brand-200 font-semibold border border-brand-500/30 shadow-sm"
                      : "text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-brand-400" : "text-neutral-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        active ? "bg-brand-500 text-[#041620]" : "bg-ink-800 text-neutral-300 border border-white/10"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Categories Section */}
        <div>
          <div className="text-xs font-semibold text-neutral-500 px-3 mb-2 tracking-wider uppercase">
            Categories
          </div>
          <nav className="space-y-1">
            {categoryItems.map((cat) => {
              const active = pathname === cat.href;
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={close}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${
                    active
                      ? "bg-white/10 text-white font-semibold border border-white/15"
                      : "text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${categoryIconClass[cat.category]}`} />
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Telegram Saved Messages Connection Card */}
        <div className="p-3.5 rounded-2xl bg-brand-500/[0.07] border border-brand-500/25">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center border border-brand-500/30">
                <Send className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">Saved Messages</span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                tgStatus.connected ? "bg-brand-400 animate-pulse" : "bg-neutral-500"
              }`}
            />
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed mb-3">
            {tgStatus.connected
              ? `Linked to @${tgStatus.username || "personal"}`
              : "Connect personal Telegram account to activate sovereign cloud storage."}
          </p>

          <Link
            href="/connect-telegram"
            onClick={close}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-200 border border-brand-500/30 transition min-h-[44px]"
          >
            <span>{tgStatus.connected ? "Connection Status" : "Connect Telegram"}</span>
            <ChevronRight className="w-3 h-3 text-brand-400" />
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/privacy"
          onClick={close}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition min-h-[44px] ${
            pathname === "/privacy" ? "bg-white/10 text-white font-semibold border border-white/15" : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Shield className="w-4 h-4 text-neutral-300" />
          <span>Privacy & Security</span>
        </Link>
        <Link
          href="/settings"
          onClick={close}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition min-h-[44px] ${
            pathname === "/settings" ? "bg-white/10 text-white font-semibold border border-white/15" : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition text-left min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
