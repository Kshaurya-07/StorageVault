"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import FileCard from "@/components/FileCard";
import FilePreviewModal from "@/components/FilePreviewModal";
import EmptyState from "@/components/EmptyState";
import { FileGridSkeleton } from "@/components/LoadingSkeleton";
import Storage3DStack from "@/components/3d/Storage3DStack";
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
      <Header title="StorageVault Dashboard" onUploadSuccess={fetchData} />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Telegram Connection Alert Banner */}
        {!tgStatus.connected && (
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Connect Your Telegram Saved Messages
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                  StorageVault uses your personal Telegram account as your private sovereign cloud.
                  Link your account to unlock unlimited uploads, streaming downloads, and AI indexing.
                </p>
              </div>
            </div>
            <Link
              href="/connect-telegram"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition shrink-0 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Connect Now</span>
            </Link>
          </div>
        )}

        {/* 3D Spatial Volume & Storage Hero Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 3D Drive Stack Interactive Scene */}
          <div className="lg:col-span-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Sovereign Disk Array</h2>
                <p className="text-[11px] text-neutral-400">Telegram Saved Messages Mount</p>
              </div>
              <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                MTPROTO READY
              </div>
            </div>
            <Storage3DStack usedBytes={analytics?.totalSizeBytes || 0} />
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 font-mono">
              <span>Indexed: {analytics?.formattedTotalSize || "0 B"}</span>
              <span>Quota: Unlimited</span>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Total Indexed Size */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
                <span>Indexed Vault Storage</span>
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {analytics?.formattedTotalSize || "0 Bytes"}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  In Personal Saved Messages
                </div>
              </div>
            </div>

            {/* Card 2: Total Indexed Files */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
                <span>Total Indexed Files</span>
                <FolderOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {analytics?.totalFiles ?? 0}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {analytics?.recentUploadsCount ?? 0} uploaded in past 7 days
                </div>
              </div>
            </div>

            {/* Card 3: AI Assistant */}
            <Link href="/ai-search" className="glass-card rounded-2xl p-5 group flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
                <span>AI Search Engine</span>
                <Sparkles className="w-4 h-4 text-neutral-300 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-sm font-bold text-white group-hover:underline transition">
                  Natural Language Query
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1 font-mono">
                  <span>&quot;Find PDFs &gt; 50MB&quot;</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 4: Telegram Connection Status */}
            <Link
              href="/connect-telegram"
              className="glass-card rounded-2xl p-5 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-3">
                <span>Telegram Account</span>
                <Send className="w-4 h-4 text-neutral-300 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tgStatus.connected ? "bg-white animate-pulse" : "bg-neutral-600"
                    }`}
                  />
                  <span>{tgStatus.connected ? "Active & Linked" : "Not Linked"}</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                  {tgStatus.connected
                    ? `@${tgStatus.username || "Saved Messages"}`
                    : "Click to link personal account"}
                </div>
              </div>
            </Link>
          </div>
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
              className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 transition group flex flex-col justify-between"
            >
              <span className="text-xs font-semibold text-neutral-300 group-hover:text-white transition">
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
              <p className="text-xs text-neutral-400">
                Latest files synced to your personal Saved Messages
              </p>
            </div>
            <Link
              href="/files"
              className="text-xs font-semibold text-white hover:underline flex items-center gap-1"
            >
              <span>View All Files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <FileGridSkeleton />
          ) : recentFiles.length === 0 ? (
            <EmptyState
              title="Your StorageVault is Empty"
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
