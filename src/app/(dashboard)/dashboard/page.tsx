"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import FileCard from "@/components/FileCard";
import FilePreviewModal from "@/components/FilePreviewModal";
import EmptyState from "@/components/EmptyState";
import { FileGridSkeleton } from "@/components/LoadingSkeleton";
import { FileMetadata, StorageAnalyticsData } from "@/lib/types";
import {
  HardDrive,
  Send,
  Sparkles,
  BarChart3,
  Upload,
  ArrowRight,
  ShieldCheck,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<StorageAnalyticsData | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [tgStatus, setTgStatus] = useState<{
    connected: boolean;
    username?: string;
  }>({ connected: false });

  const fetchData = async () => {
    try {
      const [resAnalytics, resFiles, resTg] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/files?limit=8&sortBy=uploadedAt&sortOrder=desc"),
        fetch("/api/telegram/status"),
      ]);

      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resFiles.ok) {
        const data = await resFiles.json();
        setRecentFiles(data.files || []);
      }
      if (resTg.ok) setTgStatus(await resTg.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file permanently from Telegram Saved Messages?")) {
      return;
    }
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecentFiles((prev) => prev.filter((f) => f.id !== id));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !current }),
      });
      if (res.ok) {
        setRecentFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isFavorite: !current } : f))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayFilename: newName }),
      });
      if (res.ok) {
        setRecentFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, displayFilename: newName } : f))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header title="Vault Dashboard" onUploadSuccess={fetchData} />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Telegram Connection Alert Banner */}
        {!tgStatus.connected && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  Connect Your Telegram Saved Messages
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  VAULT AI uses your personal Telegram account as your private cloud.
                  Link your account to unlock uploads, streaming downloads, and AI indexing.
                </p>
              </div>
            </div>
            <Link
              href="/connect-telegram"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Connect Now</span>
            </Link>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Indexed Size */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>Indexed Vault Storage</span>
              <HardDrive className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {analytics?.formattedTotalSize || "0 Bytes"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>In Telegram Saved Messages</span>
            </div>
          </div>

          {/* Card 2: Total Indexed Files */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>Total Indexed Files</span>
              <FolderOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {analytics?.totalFiles ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {analytics?.recentUploadsCount ?? 0} uploaded in past 7 days
            </div>
          </div>

          {/* Card 3: AI Assistant */}
          <Link href="/ai-search" className="glass-card rounded-2xl p-5 group block">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>AI Search Engine</span>
              <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition">
              Natural Language Query
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <span>&quot;Find PDFs &gt; 50MB&quot;</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Telegram Connection Status */}
          <Link
            href="/connect-telegram"
            className="glass-card rounded-2xl p-5 group block"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>Telegram Account</span>
              <Send className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  tgStatus.connected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>{tgStatus.connected ? "Active & Linked" : "Not Linked"}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {tgStatus.connected
                ? `@${tgStatus.username || "Saved Messages"}`
                : "Click to link personal account"}
            </div>
          </Link>
        </div>

        {/* Quick Navigation Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Documents", href: "/files/documents", count: analytics?.categoryCounts.DOCUMENT || 0 },
            { label: "Images", href: "/files/images", count: analytics?.categoryCounts.IMAGE || 0 },
            { label: "Videos", href: "/files/videos", count: analytics?.categoryCounts.VIDEO || 0 },
            { label: "Audio", href: "/files/audio", count: analytics?.categoryCounts.AUDIO || 0 },
            { label: "Archives", href: "/files/archives", count: analytics?.categoryCounts.ARCHIVE || 0 },
          ].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/60 transition group flex flex-col justify-between"
            >
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition">
                {cat.label}
              </span>
              <span className="text-base font-extrabold text-white mt-2">
                {cat.count}
              </span>
            </Link>
          ))}
        </div>

        {/* Recent Files Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Uploads</h2>
              <p className="text-xs text-slate-400">
                Latest files synced to your personal Saved Messages
              </p>
            </div>
            <Link
              href="/files"
              className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <FileGridSkeleton />
          ) : recentFiles.length === 0 ? (
            <EmptyState
              title="Your Vault is Empty"
              description="Upload your first file to have it stored securely in your personal Telegram Saved Messages."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={(f) => setPreviewFile(f)}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  );
}
