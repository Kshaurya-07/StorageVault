"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import FileCard from "./FileCard";
import FileListRow from "./FileListRow";
import FilePreviewModal from "./FilePreviewModal";
import EmptyState from "./EmptyState";
import { FileGridSkeleton, FileTableSkeleton } from "./LoadingSkeleton";
import { FileCategory, FileMetadata } from "@/lib/types";
import {
  Grid,
  List,
  ArrowUpDown,
  Search,
  Filter,
  FilePlus,
  RefreshCw,
} from "lucide-react";

import Document3DPreview from "./3d/Document3DPreview";

interface FilesViewProps {
  title: string;
  category?: FileCategory;
  isFavorite?: boolean;
  isRecent?: boolean;
}

export default function FilesView({
  title,
  category,
  isFavorite,
  isRecent,
}: FilesViewProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"uploadedAt" | "size" | "name">("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (isFavorite) params.set("favorite", "true");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (isRecent) {
        params.set("limit", "24");
      } else {
        params.set("limit", "100");
      }

      const res = await fetch(`/api/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [category, isFavorite, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file permanently from Telegram Saved Messages?")) {
      return;
    }
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
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
        if (isFavorite && current) {
          setFiles((prev) => prev.filter((f) => f.id !== id));
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, isFavorite: !current } : f))
          );
        }
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
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, displayFilename: newName } : f))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header
        title={title}
        onUploadSuccess={fetchFiles}
        onSearch={(q) => {
          setSearchQuery(q);
          fetchFiles();
        }}
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* 3D Asset Header Block */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-200 text-xs font-mono">
              SOVEREIGN CLOUD DIRECTORY
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-neutral-400 max-w-md">
              Encrypted files stored in personal Telegram Saved Messages, indexed into isolated metadata partitions.
            </p>
          </div>
          <div className="w-full md:w-64 h-[120px] flex items-center justify-center">
            <Document3DPreview className="w-full h-full" />
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
          {/* In-page search */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-sm flex items-center"
          >
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5" />
            <input
              type="text"
              placeholder={`Search in ${title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ink-800 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTimeout(fetchFiles, 50);
                }}
                className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            )}
          </form>

          {/* Sort & View Mode Switches */}
          <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <ArrowUpDown className="w-4 h-4 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-ink-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
              >
                <option value="uploadedAt">Upload Date</option>
                <option value="size">File Size</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-neutral-300 transition text-sm font-bold"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchFiles}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition"
              title="Refresh files"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Grid / List View Toggle */}
            <div className="flex items-center bg-ink-800 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`min-w-[44px] min-h-[40px] flex items-center justify-center rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-brand-500 text-[#041620] font-semibold shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`min-w-[44px] min-h-[40px] flex items-center justify-center rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-brand-500 text-[#041620] font-semibold shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="List view"
                aria-pressed={viewMode === "list"}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* File Content Area */}
        {loading ? (
          viewMode === "grid" ? (
            <FileGridSkeleton />
          ) : (
            <FileTableSkeleton />
          )
        ) : files.length === 0 ? (
          <EmptyState
            title={`No files found in ${title}`}
            description={
              searchQuery
                ? `No files match "${searchQuery}". Try clearing filters.`
                : "Upload files to start managing your personal Telegram Saved Messages storage."
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
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
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-ink-800/60 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Date Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <FileListRow
                      key={file.id}
                      file={file}
                      onPreview={(f) => setPreviewFile(f)}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  );
}
