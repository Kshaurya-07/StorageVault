"use client";

import Link from "next/link";
import { ShieldCheck, HardDrive, Sparkles, ArrowRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg group-hover:border-neutral-600 transition-colors">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Storage<span className="text-neutral-400 font-medium">Vault</span>
            </span>
            <span className="text-[10px] text-neutral-400 tracking-wider uppercase font-medium">
              Sovereign Cloud Storage
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#timeline" className="hover:text-white transition-colors">
            Architecture
          </Link>
          <Link href="#security" className="hover:text-white transition-colors">
            Zero-Knowledge
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Security Specs
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-300 hover:text-white px-4 py-2 rounded-xl hover:bg-neutral-900/60 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-white text-black hover:bg-neutral-200 px-5 py-2.5 rounded-xl shadow-lg shadow-black/40 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
