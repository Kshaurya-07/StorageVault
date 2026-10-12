"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DataPillar3D from "@/components/3d/DataPillar3D";
import { StorageAnalyticsData } from "@/lib/types";
import { formatBytes } from "@/lib/fileCategories";
import {
  BarChart3,
  HardDrive,
  FolderOpen,
  Clock,
  TrendingUp,
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
        <Header title="StorageVault Analytics" />
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="h-40 rounded-2xl bg-neutral-900 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-neutral-900 animate-pulse" />
            <div className="h-64 rounded-2xl bg-neutral-900 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  // Strict Monochrome Palette for category progression
  const categories = [
    { key: "DOCUMENT", label: "Documents", barColor: "bg-white", text: "text-neutral-100" },
    { key: "IMAGE", label: "Images", barColor: "bg-neutral-300", text: "text-neutral-200" },
    { key: "VIDEO", label: "Videos", barColor: "bg-neutral-400", text: "text-neutral-300" },
    { key: "AUDIO", label: "Audio", barColor: "bg-neutral-500", text: "text-neutral-400" },
    { key: "ARCHIVE", label: "Archives", barColor: "bg-neutral-600", text: "text-neutral-400" },
    { key: "OTHER", label: "Other", barColor: "bg-neutral-700", text: "text-neutral-500" },
  ] as const;

  return (
    <>
      <Header title="StorageVault Analytics" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Banner with Clear Storage Label Notice */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3.5 text-xs">
          <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <div className="text-neutral-300 leading-relaxed">
            <span className="font-bold text-white">Indexed Storage Statistics: </span>
            The metrics below reflect the files indexed and managed through your StorageVault account.
            Files are hosted in your personal Telegram Saved Messages. Telegram does not enforce
            an arbitrary quota on personal messages, allowing unlimited storage up to 2GB per file.
          </div>
        </div>

        {/* 3D Isometric Volume Visualizer & Top KPI row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white">Isometric Volume Matrix</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                DISTRIBUTION 3D
              </span>
            </div>
            <DataPillar3D />
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 font-mono">
              <span>Sovereignty: 100%</span>
              <span>Quota: Unlimited</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Total Indexed</span>
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {data?.formattedTotalSize || "0 Bytes"}
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                  Saved Messages Storage
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Total Files</span>
                <FolderOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {data?.totalFiles ?? 0}
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                  PostgreSQL Metadata Index
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Recent (7d)</span>
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {data?.recentUploadsCount ?? 0}
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                  New files synced
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Category Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: File Count Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-white" />
              <span>File Count by Category</span>
            </h3>

            <div className="space-y-3 pt-2">
              {categories.map((cat) => {
                const count = data?.categoryCounts[cat.key] || 0;
                const total = data?.totalFiles || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={cat.key} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-300 font-mono">
                      <span className={cat.text}>{cat.label}</span>
                      <span>
                        {count} files ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full ${cat.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Storage Size Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <span>Storage Size by Category</span>
            </h3>

            <div className="space-y-3 pt-2">
              {categories.map((cat) => {
                const bytes = data?.categorySizes[cat.key] || 0;
                const total = data?.totalSizeBytes || 1;
                const percentage = Math.round((bytes / total) * 100);

                return (
                  <div key={cat.key} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-300 font-mono">
                      <span className={cat.text}>{cat.label}</span>
                      <span>
                        {formatBytes(bytes)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full ${cat.barColor} rounded-full transition-all duration-500`}
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
        <div className="glass-panel p-6 rounded-2xl border border-neutral-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-white" />
            <span>Largest Files in StorageVault</span>
          </h3>

          {data?.largestFiles && data.largestFiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase font-mono">
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
                      className="border-b border-neutral-850 hover:bg-neutral-900 transition"
                    >
                      <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">
                        {file.displayFilename}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-200">
                        {formatBytes(file.fileSizeBytes)}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400 font-mono">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={`/api/files/${file.id}/download`}
                          download={file.originalFilename}
                          className="inline-flex items-center gap-1 text-white hover:underline font-semibold"
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
            <p className="text-xs text-neutral-400">No files uploaded yet.</p>
          )}
        </div>
      </main>
    </>
  );
}
