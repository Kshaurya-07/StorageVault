"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  Send,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Menu,
} from "lucide-react";
import FileUploadModal from "./FileUploadModal";
import { useSidebar } from "./SidebarContext";

export default function Header({
  onSearch,
  onUploadSuccess,
  title,
}: {
  onSearch?: (query: string) => void;
  onUploadSuccess?: () => void;
  title?: string;
}) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const [searchVal, setSearchVal] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [tgStatus, setTgStatus] = useState<{
    connected: boolean;
    username?: string;
  }>({ connected: false });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
          setTgStatus(data.telegram || { connected: false });
        }
      })
      .catch(() => {});
  }, []);

  // Mobile bottom tab bar dispatches this to open the shared upload modal.
  useEffect(() => {
    const open = () => setIsUploadOpen(true);
    window.addEventListener("vault:open-upload", open);
    return () => window.removeEventListener("vault:open-upload", open);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchVal);
    } else if (searchVal.trim()) {
      router.push(`/ai-search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-white/10 bg-ink-900/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-ink-800 hover:bg-ink-700 text-neutral-300 hover:text-white border border-white/10 transition shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-white capitalize truncate">
            {title || "StorageVault Dashboard"}
          </h1>
        </div>

        {/* Global Search bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative max-w-md w-full mx-6 hidden sm:block"
        >
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, tag, or AI query (e.g. 'Show PDFs > 50MB')..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-ink-800/90 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition"
          />
        </form>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Telegram Status Pill */}
          <Link
            href="/connect-telegram"
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border transition min-h-[40px] ${
              tgStatus.connected
                ? "bg-brand-500/10 border-brand-500/40 text-brand-200 hover:bg-brand-500/20"
                : "bg-ink-800/60 border-white/10 text-neutral-400 hover:bg-ink-700"
            }`}
          >
            <Send className={`w-3.5 h-3.5 ${tgStatus.connected ? "text-brand-400" : "text-neutral-400"}`} />
            <span>
              {tgStatus.connected
                ? `@${tgStatus.username || "Saved Messages"}`
                : "Connect Telegram"}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                tgStatus.connected ? "bg-brand-400 animate-pulse" : "bg-neutral-600"
              }`}
            />
          </Link>

          {/* Upload Button — icon-only on phones, labeled on sm+ */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-[#041620] text-xs font-bold min-w-[44px] min-h-[44px] px-3 sm:px-4 rounded-xl shadow-lg shadow-brand-500/25 transition"
          >
            <Upload className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {/* User profile / avatar */}
          <Link
            href="/settings"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white hover:border-brand-500/50 transition"
            title={user?.email || "Account"}
          >
            {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
          </Link>
        </div>
      </header>

      {/* File Upload Modal */}
      {isUploadOpen && (
        <FileUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            if (onUploadSuccess) onUploadSuccess();
          }}
        />
      )}
    </>
  );
}
