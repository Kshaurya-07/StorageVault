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
      <header className="h-16 border-b border-neutral-800/80 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="lg:hidden p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white capitalize truncate">
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
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition"
          />
        </form>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-3">
          {/* Telegram Status Pill */}
          <Link
            href="/connect-telegram"
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              tgStatus.connected
                ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <Send className="w-3 h-3 text-neutral-400" />
            <span>
              {tgStatus.connected
                ? `@${tgStatus.username || "Saved Messages"}`
                : "Connect Telegram"}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                tgStatus.connected ? "bg-white animate-pulse" : "bg-neutral-600"
              }`}
            />
          </Link>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          {/* User profile dropdown / avatar */}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-white hover:border-neutral-600 transition"
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
