"use client";

import Link from "next/link";
import VaultEmblem3D from "@/components/3d/VaultEmblem3D";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
      {/* Subtle ambient light */}
      <div className="absolute w-[500px] h-[500px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10 glass-panel p-8 rounded-3xl border border-neutral-800">
        <div className="w-32 h-32 mx-auto flex items-center justify-center">
          <VaultEmblem3D className="w-full h-full" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
            SECTOR 404
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sector Not Found
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The requested cryptographic coordinate or page does not exist in StorageVault.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono text-xs">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-5 py-2.5 rounded-xl transition"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
