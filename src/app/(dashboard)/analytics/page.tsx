"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { StorageAnalyticsData } from "@/lib/types";
import { formatBytes, getCategoryBadgeColor } from "@/lib/fileCategories";
import {
  BarChart3,
  HardDrive,
  FolderOpen,
  Clock,
  TrendingUp,
  FileText,
  ShieldCheck,
  AlertCircle,
  Download,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<StorageAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Storage Analytics" />
        <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="h-40 rounded-2xl bg-slate-900/60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-slate-900/60 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-900/60 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  const categories = [
    { key: "DOCUMENT", label: "Documents", color: "bg-blue-500", text: "text-blue-400" },
    { key: "IMAGE", label: "Images", color: "bg-emerald-500", text: "text-emerald-400" },
    { key: "VIDEO", label: "Videos", color: "bg-purple-500", text: "text-purple-400" },
    { key: "AUDIO", label: "Audio", color: "bg-amber-500", text: "text-amber-400" },
    { key: "ARCHIVE", label: "Archives", color: "bg-rose-500", text: "text-rose-400" },
    { key: "OTHER", label: "Other", color: "bg-zinc-500", text: "text-zinc-400" },
  ] as const;

  return (
    <>
      <Header title="Vault Storage Analytics" />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Banner with Clear Storage Label Notice */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/5 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-slate-300">
            <span className="font-bold text-white">Indexed Storage Statistics: </span>
            The metrics below reflect the files indexed and managed through your VAULT AI account.
            Files are hosted in your personal Telegram Saved Messages. Telegram itself does not enforce
            a strict quota on personal messages, allowing practically unlimited storage up to 2GB per file.
          </div>
        </div>

        {/* Top 3 High Level KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Indexed Storage</span>
              <HardDrive className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.formattedTotalSize || "0 Bytes"}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Across all categories in Saved Messages
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Files Stored</span>
              <FolderOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.totalFiles ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Indexed in PostgreSQL metadata
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Recent Activity (7 Days)</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.recentUploadsCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              New files synced recently
            </div>
          </div>
        </div>

        {/* Breakdown by Category Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card: File Count Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>File Count by Category</span>
            </h3>

            <div className="space-y-3 pt-2">
              {categories.map((cat) => {
                const count = data?.categoryCounts[cat.key] || 0;
                const total = data?.totalFiles || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={cat.key} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className={cat.text}>{cat.label}</span>
                      <span>
                        {count} files ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Storage Size Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Storage Size by Category</span>
            </h3>

            <div className="space-y-3 pt-2">
              {categories.map((cat) => {
                const bytes = data?.categorySizes[cat.key] || 0;
                const total = data?.totalSizeBytes || 1;
                const percentage = Math.round((bytes / total) * 100);

                return (
                  <div key={cat.key} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className={cat.text}>{cat.label}</span>
                      <span>
                        {formatBytes(bytes)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Largest Files Table */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Largest Files in Vault</span>
          </h3>

          {data?.largestFiles && data.largestFiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.largestFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">
                        {file.displayFilename}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-200">
                        {formatBytes(file.fileSizeBytes)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={`/api/files/${file.id}/download`}
                          download={file.originalFilename}
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Stream</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No files uploaded yet.</p>
          )}
        </div>
      </main>
    </>
  );
}
