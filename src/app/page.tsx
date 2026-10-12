"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Vault3DCore from "@/components/3d/Vault3DCore";
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
  KeyRound,
  FileCheck,
  Server,
  Zap,
  EyeOff,
  Database,
  RefreshCw,
  FolderLock,
} from "lucide-react";

export default function LandingPage() {
  const timelineSteps = [
    {
      num: "01",
      title: "Secure MTProto Connection",
      tag: "Authentication",
      desc: "Connect your personal Telegram account via official MTProto session protocols. Your session token is sealed with AES-256-GCM encryption in an isolated tenant partition with zero cross-user access.",
      icon: KeyRound,
    },
    {
      num: "02",
      title: "Cryptographic Chunking",
      tag: "Encryption",
      desc: "Large files are split into deterministic binary chunks up to 2GB each. Each payload is encrypted with authenticated AES-256-GCM ciphers before transit, ensuring total zero-knowledge data privacy.",
      icon: Lock,
    },
    {
      num: "03",
      title: "Personal Saved Messages Cloud",
      tag: "Direct Transmission",
      desc: "Payload chunks stream directly into your Telegram account's private 'Saved Messages' dialogue. StorageVault never pools files in shared bot channels or public groups—your storage remains 100% sovereign.",
      icon: Send,
    },
    {
      num: "04",
      title: "Encrypted Metadata Indexing",
      tag: "PostgreSQL Engine",
      desc: "Only lightweight cryptographic hashes, mime-types, file sizes, and Telegram message IDs are indexed into PostgreSQL. Our servers maintain zero permanent disk storage of your actual file contents.",
      icon: Database,
    },
    {
      num: "05",
      title: "Zero-Training AI File Discovery",
      tag: "Privacy AI",
      desc: "Query your entire file library in plain English: 'Find tax documents > 10MB from last November'. Queries are parsed into structured database filters with strictly zero model training on your data.",
      icon: Sparkles,
    },
    {
      num: "06",
      title: "On-Demand Stream Decryption",
      tag: "Instant Delivery",
      desc: "Download or preview files instantaneously. Multi-part streams are piped directly from your Telegram Saved Messages to your browser through memory buffers with zero disk caching on the host server.",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 selection:bg-neutral-800 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b border-neutral-800/60">
        {/* Subtle ambient radial depth (monochrome) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span>Personal Telegram Sovereign Cloud</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                Your Digital World. <br />
                <span className="text-neutral-400">One Secure Vault.</span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed font-normal">
                StorageVault transforms your personal Telegram account&apos;s <strong>Saved Messages</strong> into
                an unlimited, zero-knowledge private cloud drive. Upload without host disk storage, search with
                ephemeral privacy-first AI, and take absolute sovereignty over your files.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                  Create StorageVault Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-semibold px-7 py-3.5 rounded-xl transition text-sm"
                >
                  Sign In to Vault
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-900 text-xs text-neutral-400 font-mono">
                <div>
                  <div className="font-bold text-white text-sm">2GB</div>
                  <div>Per File Limit</div>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">AES-256</div>
                  <div>GCM Authenticated</div>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">0 Disk</div>
                  <div>Host Server Footprint</div>
                </div>
              </div>
            </div>

            {/* Right Hero 3D Scene */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full max-w-[420px] aspect-square rounded-3xl bg-neutral-950/80 border border-neutral-800/80 p-4 shadow-2xl relative">
                <Vault3DCore className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant Zero-Knowledge Architecture Section */}
      <section id="security" className="py-20 border-b border-neutral-800/60 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              True Tenant Isolation
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Direct Account-to-Saved-Messages Architecture
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Unlike insecure bot applications that dump all users&apos; files into a shared channel or centralized bucket,
              StorageVault connects to your own Telegram account and operates solely inside your personal dialogue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* User A Isolation Box */}
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-sm text-white">
                  <KeyRound className="w-4 h-4 text-neutral-300" />
                  <span>User A Isolated Sandbox</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono">
                  PARTITION 01
                </span>
              </div>
              <div className="space-y-2 text-xs text-neutral-300 font-mono">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>StorageVault Account A (Argon2 / AES-256)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Telegram Account A (MTProto Client)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Saved Messages A (Sovereign Cloud)</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                User A has cryptographic exclusivity. All queries are strictly scoped by <code>userId</code> in PostgreSQL.
              </p>
            </div>

            {/* User B Isolation Box */}
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-sm text-white">
                  <KeyRound className="w-4 h-4 text-neutral-300" />
                  <span>User B Isolated Sandbox</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono">
                  PARTITION 02
                </span>
              </div>
              <div className="space-y-2 text-xs text-neutral-300 font-mono">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>StorageVault Account B (Argon2 / AES-256)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Telegram Account B (MTProto Client)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Saved Messages B (Sovereign Cloud)</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                User B cannot access, read, or discover User A data. Zero leakage across tenant partitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Workflow Timeline */}
      <section id="timeline" className="py-24 border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              End-to-End Mechanics
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              How StorageVault Operates
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              A transparent, 6-stage lifecycle engineered for security, high throughput, and zero permanent server overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700 text-white">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-2xl font-mono font-bold text-neutral-600">
                        {step.num}
                      </span>
                    </div>
                    <div className="inline-block text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded mb-2">
                      {step.tag}
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 border-b border-neutral-800/60 bg-neutral-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Performance Pillars
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Engineered for Speed & Sovereignty
            </h3>
            <p className="text-sm text-neutral-400">
              Stop paying recurring storage surcharges. Harness the resilience of Telegram Saved Messages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-white">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Saved Messages Storage</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your Telegram account via MTProto session keys. All files live inside your private Saved Messages chat. No bots, no shared channels.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Privacy-First AI Search</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Search with natural language queries: &quot;Show PDF invoices over 5MB&quot; or &quot;Find React notes from Tuesday&quot;. Zero LLM training on your files.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-white">
                <EyeOff className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Zero Host Disk Storage</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Uploads stream straight to Telegram; downloads stream straight to your device. The host server holds only encrypted metadata pointers in PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-neutral-800 bg-[#070707] py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <HardDrive className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white">StorageVault</span>
            <span className="text-neutral-500">&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Architecture
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="text-white hover:underline font-semibold">
              Create StorageVault Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
