"use client";

import Link from "next/link";
import { HardDrive, ArrowRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
      {/* min-w-0 + shrink handling: brand truncates, CTAs never wrap or overflow at 360px */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 group min-w-0 shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-500/15 border border-brand-500/40 flex items-center justify-center shadow-lg group-hover:border-brand-500/70 transition-colors shrink-0">
            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base sm:text-xl tracking-tight text-white flex items-center gap-1.5 truncate">
              Storage<span className="text-neutral-400 font-medium">Vault</span>
            </span>
            <span className="hidden min-[420px]:block text-[10px] text-neutral-400 tracking-wider uppercase font-medium truncate">
              Sovereign Cloud Storage
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300 shrink-0">
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#security" className="hover:text-white transition-colors">
            Security
          </Link>
          <Link href="#ai-search" className="hover:text-white transition-colors">
            AI Search
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/5 transition min-h-[44px] items-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-bold bg-brand-500 text-[#041620] hover:bg-brand-600 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-1.5 sm:gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[44px] whitespace-nowrap"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
