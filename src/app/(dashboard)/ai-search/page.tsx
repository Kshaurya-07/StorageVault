"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import FileCard from "@/components/FileCard";
import FilePreviewModal from "@/components/FilePreviewModal";
import EmptyState from "@/components/EmptyState";
import { FileGridSkeleton } from "@/components/LoadingSkeleton";
import { AiSearchResult, FileMetadata } from "@/lib/types";
import {
  Sparkles,
  Search,
  ShieldCheck,
  Tag,
  Calendar,
  Layers,
  HardDrive,
  Loader2,
  Info,
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

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Hero Search Box */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Retention Privacy-Safe AI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Search Your Vault in Plain English
            </h2>
            <p className="text-xs text-slate-300">
              Query files by topic, date, size range, or category. Queries are processed
              ephemerally and never used for model training.
            </p>
          </div>

          {/* Search Input Form */}
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto relative mb-5">
            <input
              type="text"
              placeholder="e.g. 'Find my Java notes' or 'Show PDFs uploaded last week'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 focus:border-blue-500 rounded-2xl pl-5 pr-28 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none shadow-xl transition"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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
            <span className="text-slate-400 text-[11px]">Try queries:</span>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  handleSearch(sample);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-white/5 transition text-[11px]"
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
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-blue-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{result.explanation}</span>
              </div>

              {/* Suggested Tags */}
              {result.suggestedTags && result.suggestedTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
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
                      className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-semibold border border-blue-500/20 transition"
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
                title="No Matching Files in Your Vault"
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
        <div className="p-4 rounded-2xl bg-[#0c1222] border border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold text-slate-300">Strict AI Privacy Policy:</span>
            <span>Zero personal memory persistence. Zero model training. Owner-scoped only.</span>
          </div>
          <span className="hidden sm:inline">VAULT AI Engine v1.0</span>
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
