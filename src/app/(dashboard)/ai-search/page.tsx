"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import FileCard from "@/components/FileCard";
import FilePreviewModal from "@/components/FilePreviewModal";
import EmptyState from "@/components/EmptyState";
import { FileGridSkeleton } from "@/components/LoadingSkeleton";
import NodeMesh3D from "@/components/3d/NodeMesh3D";
import { AiSearchResult, FileMetadata } from "@/lib/types";
import {
  Sparkles,
  Search,
  ShieldCheck,
  Tag,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function AiSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSearchResult | null>(null);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  const sampleQueries = [
    "Find my Java notes",
    "Show PDFs uploaded last week",
    "Find my Navratri posters",
    "Show videos larger than 100 MB",
    "Find my DBMS assignment",
    "Show files uploaded yesterday",
  ];

  const handleSearch = async (queryString: string) => {
    if (!queryString.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryString.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file permanently from Telegram Saved Messages?")) {
      return;
    }
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (result) {
          setResult({
            ...result,
            matchedFiles: result.matchedFiles.filter((f) => f.id !== id),
          });
        }
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
      if (res.ok && result) {
        setResult({
          ...result,
          matchedFiles: result.matchedFiles.map((f) =>
            f.id === id ? { ...f, isFavorite: !current } : f
          ),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header title="AI File Search Assistant" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Hero Search Box with 3D Neural Discovery Orb */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-6">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Zero-Retention Privacy-Safe AI</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Search Your StorageVault in Plain English
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                Query files by topic, temporal references, size range, or file categories.
                Queries are processed ephemerally into deterministic database filters and never retained.
              </p>
            </div>
            <div className="md:col-span-4 h-[160px] flex items-center justify-center">
              <NodeMesh3D isSearching={loading} className="w-full h-full" />
            </div>
          </div>

          {/* Search Input Form */}
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto relative mb-5">
            <input
              type="text"
              placeholder="e.g. 'Find my Java notes' or 'Show PDFs uploaded last week'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-ink-800 border border-white/10 focus:border-brand-500/60 rounded-2xl pl-5 pr-32 py-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40 shadow-xl transition"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-[#041620] font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-brand-500/25 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#041620]" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt pills */}
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-neutral-500 text-xs font-mono">Suggested:</span>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  handleSearch(sample);
                }}
                className="px-3 py-2 rounded-lg bg-ink-800 hover:bg-ink-700 text-neutral-300 hover:text-white border border-white/10 transition text-xs min-h-[36px]"
              >
                &quot;{sample}&quot;
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Explanation & Filter Breakdown Bar */}
            <div className="p-4 rounded-2xl bg-ink-800 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-neutral-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>{result.explanation}</span>
              </div>

              {/* Suggested Tags */}
              {result.suggestedTags && result.suggestedTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
                    <Tag className="w-3 h-3" /> Related:
                  </span>
                  {result.suggestedTags.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const newQ = `Files tagged with ${t}`;
                        setQuery(newQ);
                        handleSearch(newQ);
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-semibold border border-neutral-700 transition"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matched Files Grid */}
            {result.matchedFiles.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No Matching Files in Your StorageVault"
                description={`AI scanned your private files for "${result.query}" but found no matching records. Try broader keywords or different size/date constraints.`}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {result.matchedFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={(f) => setPreviewFile(f)}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && <FileGridSkeleton />}

        {/* Privacy Guarantee Footer Card */}
        <div className="p-4 rounded-2xl bg-ink-800/60 border border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2 text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="font-semibold text-white">Strict AI Privacy Policy:</span>
            <span>Zero personal memory persistence. Zero model training. Owner-scoped only.</span>
          </div>
          <span className="hidden sm:inline font-mono text-xs">StorageVault AI Engine v1.0</span>
        </div>
      </main>

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  );
}

export default function AiSearchPage() {
  return (
    <Suspense fallback={<FileGridSkeleton />}>
      <AiSearchContent />
    </Suspense>
  );
}
