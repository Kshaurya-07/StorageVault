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
} from "lucide-react";
import FileUploadModal from "./FileUploadModal";

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
      <header className="h-16 border-b border-white/5 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white capitalize">
            {title || "Vault Dashboard"}
          </h1>
        </div>

        {/* Global Search bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative max-w-md w-full mx-6 hidden sm:block"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, tag, or AI query (e.g. 'Show PDFs > 50MB')..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-[#11192e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </form>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-3">
          {/* Telegram Status Pill */}
          <Link
            href="/connect-telegram"
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              tgStatus.connected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <Send className="w-3 h-3" />
            <span>
              {tgStatus.connected
                ? `@${tgStatus.username || "Saved Messages"}`
                : "Connect Telegram"}
            </span>
            {tgStatus.connected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </Link>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          {/* User profile dropdown / avatar */}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white hover:border-blue-500 transition"
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
