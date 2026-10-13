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

  const categoryItems = [
    { label: "Documents", href: "/files/documents", icon: FileText, color: "text-neutral-300" },
    { label: "Images", href: "/files/images", icon: ImageIcon, color: "text-neutral-300" },
    { label: "Videos", href: "/files/videos", icon: Video, color: "text-neutral-300" },
    { label: "Audio", href: "/files/audio", icon: Music, color: "text-neutral-300" },
    { label: "Archives", href: "/files/archives", icon: Archive, color: "text-neutral-300" },
  ];

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
        className={`w-64 bg-[#0d0d0d] border-r border-neutral-800/80 flex flex-col h-screen fixed left-0 top-0 z-40 select-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-neutral-800/80 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={close}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-md">
              <HardDrive className="w-4 h-4 text-white" />
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
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          <div className="text-[11px] font-semibold text-neutral-400 px-3 mb-2 tracking-wider uppercase">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-900/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-black" : "text-neutral-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        active ? "bg-black text-white" : "bg-neutral-800 text-neutral-300 border border-neutral-700"
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
          <div className="text-[11px] font-semibold text-neutral-400 px-3 mb-2 tracking-wider uppercase">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-neutral-800 text-white font-semibold border border-neutral-700"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-900/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : cat.color}`} />
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Telegram Saved Messages Connection Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
                <Send className="w-3.5 h-3.5 text-neutral-300" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">Saved Messages</span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                tgStatus.connected ? "bg-white animate-pulse" : "bg-neutral-500"
              }`}
            />
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
            {tgStatus.connected
              ? `Linked to @${tgStatus.username || "personal"}`
              : "Connect personal Telegram account to activate sovereign cloud storage."}
          </p>

          <Link
            href="/connect-telegram"
            onClick={close}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition"
          >
            <span>{tgStatus.connected ? "Connection Status" : "Connect Telegram"}</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-neutral-800/80 space-y-1">
        <Link
          href="/privacy"
          onClick={close}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
            pathname === "/privacy" ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
          }`}
        >
          <Shield className="w-4 h-4 text-neutral-300" />
          <span>Privacy & Security</span>
        </Link>
        <Link
          href="/settings"
          onClick={close}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
            pathname === "/settings" ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
          }`}
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
