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
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
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
    { label: "Documents", href: "/files/documents", icon: FileText, color: "text-blue-400" },
    { label: "Images", href: "/files/images", icon: ImageIcon, color: "text-emerald-400" },
    { label: "Videos", href: "/files/videos", icon: Video, color: "text-purple-400" },
    { label: "Audio", href: "/files/audio", icon: Music, color: "text-amber-400" },
    { label: "Archives", href: "/files/archives", icon: Archive, color: "text-rose-400" },
  ];

  return (
    <aside className="w-64 bg-[#0c1222] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <HardDrive className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
              VAULT <span className="text-blue-400 font-extrabold">AI</span>
            </span>
            <span className="text-[9px] text-slate-400 tracking-wider uppercase font-semibold">
              Telegram Storage
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2 tracking-wider uppercase">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        active ? "bg-white text-blue-600" : "bg-blue-500/20 text-blue-300"
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
          <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2 tracking-wider uppercase">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-white/10 text-white font-semibold border border-white/10"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${cat.color}`} />
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Telegram Saved Messages Connection Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/60 border border-blue-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Saved Messages</span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                tgStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            {tgStatus.connected
              ? `Linked to @${tgStatus.username || "personal"}`
              : "Connect your Telegram account to activate personal cloud storage."}
          </p>

          <Link
            href="/connect-telegram"
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 transition"
          >
            <span>{tgStatus.connected ? "Connection Status" : "Connect Telegram"}</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          href="/privacy"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
            pathname === "/privacy" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Security</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
            pathname === "/settings" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
