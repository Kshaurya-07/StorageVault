"use client";

import { useEffect } from "react";
import Link from "next/link";
import Shield3DVault from "@/components/3d/Shield3DVault";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("StorageVault runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10 glass-panel p-8 rounded-3xl border border-neutral-800">
        <div className="w-32 h-32 mx-auto flex items-center justify-center">
          <Shield3DVault className="w-full h-full" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
            CRYPTOGRAPHIC EXCEPTION
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            System Interruption
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            An unexpected error occurred while processing your request. All cryptographic boundaries remain intact.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono text-xs">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Action
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-5 py-2.5 rounded-xl transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
