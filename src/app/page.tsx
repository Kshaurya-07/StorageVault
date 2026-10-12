"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  HardDrive,
  Send,
  Shield,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Search,
  Zap,
  KeyRound,
  FileCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-white selection:bg-blue-600">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Decentralized Personal Cloud</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            Your Personal Telegram as an{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Unlimited AI Cloud Vault
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            VAULT AI turns your personal Telegram account&apos;s <strong>Saved Messages</strong> into a
            secure, zero-knowledge cloud drive. Upload without permanent server storage, search with
            private natural-language AI, and manage all your files with zero disk footprint on our servers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
            >
              Start Free Storage Vault
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 font-semibold px-7 py-3.5 rounded-xl transition text-sm"
            >
              Sign In to Vault
            </Link>
          </div>

          {/* Architecture Visualization Card */}
          <div className="max-w-4xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 shadow-2xl relative">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
              Multi-Tenant Zero-Knowledge Architecture
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* User A Flow */}
              <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-300 mb-2">
                  <KeyRound className="w-4 h-4" /> User A Sandbox
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>VAULT Account A (Encrypted Session)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Telegram Account A (MTProto)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-blue-300 font-semibold">Saved Messages A (Private Storage)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    User A strictly accesses only their own Telegram Saved Messages.
                  </p>
                </div>
              </div>

              {/* User B Flow */}
              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-2 font-bold text-sm text-purple-300 mb-2">
                  <KeyRound className="w-4 h-4" /> User B Sandbox
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>VAULT Account B (Encrypted Session)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Telegram Account B (MTProto)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-purple-300 font-semibold">Saved Messages B (Private Storage)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    User B has zero cross-tenant access to User A files or queries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section id="features" className="py-20 border-t border-white/5 bg-[#0b101e]/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Engineered for Sovereignty & Speed
            </h2>
            <p className="text-sm text-slate-400">
              Why settle for expensive subscription tiers with storage quotas when Telegram provides
              robust, global infrastructure right in your Saved Messages?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center mb-5 text-blue-400">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Personal Saved Messages</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your personal Telegram account directly via MTProto. We do NOT use a shared bot
                or channel. Every file lives directly in your personal Saved Messages chat.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center mb-5 text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Privacy-First AI Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query your files naturally: &quot;Find Java notes from last week&quot; or &quot;Show videos &gt; 100MB&quot;.
                Zero personal memory persistence, zero training on your documents, and 100% ephemeral prompts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero Permanent Disk Footprint</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files are streamed directly into your Telegram cloud during upload and streamed back on
                download. Our servers only maintain indexed metadata, never keeping duplicate files on disk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Flow Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              How VAULT AI Works
            </h2>
            <p className="text-sm text-slate-400">
              Get up and running in under 60 seconds with your own Telegram account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 relative">
              <div className="text-3xl font-extrabold text-blue-500/40 mb-2">01</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Create Account</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register with your email and password. Your account receives isolated PostgreSQL partitions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 relative">
              <div className="text-3xl font-extrabold text-blue-500/40 mb-2">02</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Link Telegram</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorize your Telegram account via official MTProto verification code. Your session is AES-256 encrypted.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 relative">
              <div className="text-3xl font-extrabold text-blue-500/40 mb-2">03</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Drag & Drop Files</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload files up to 2GB each. They stream directly to your personal Saved Messages chat.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 relative">
              <div className="text-3xl font-extrabold text-blue-500/40 mb-2">04</div>
              <h4 className="text-sm font-bold text-white mb-1.5">AI Search & Stream</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Locate files instantaneously using AI natural language filters and stream downloads anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-white/5 bg-[#070b14] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">VAULT AI</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Architecture
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="text-blue-400 hover:underline">
              Create Vault Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
