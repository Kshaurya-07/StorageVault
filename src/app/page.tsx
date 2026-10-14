"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Vault3DCore from "@/components/3d/Vault3DCore";
import NodeMesh3D from "@/components/3d/NodeMesh3D";
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
  Star,
  Eye,
  BarChart3,
  Tags,
  FolderTree,
} from "lucide-react";

export default function LandingPage() {
  const timelineSteps = [
    {
      num: "01",
      title: "Create an account.",
      tag: "Authentication",
      desc: "Register your sovereign StorageVault credentials protected by industry-standard salted cryptographic hashes, instantiating an isolated tenant partition.",
      icon: KeyRound,
    },
    {
      num: "02",
      title: "Connect your personal Telegram account.",
      tag: "MTProto Protocol",
      desc: "Authenticate your personal Telegram account via direct MTProto session handshake. Your credentials are sealed with AES-256-GCM encryption at rest.",
      icon: Send,
    },
    {
      num: "03",
      title: "Upload your files.",
      tag: "Zero Host Disk",
      desc: "Send documents, images, video, and archives up to 2GB. Files stream directly through memory buffers to Telegram with zero server disk persistence.",
      icon: Lock,
    },
    {
      num: "04",
      title: "Store files and index their metadata.",
      tag: "Metadata Registry",
      desc: "Actual file payloads reside in your personal Saved Messages. Deterministic metadata, category hashes, and Telegram message IDs are indexed in PostgreSQL.",
      icon: Database,
    },
    {
      num: "05",
      title: "Search and organize your files.",
      tag: "Natural Language AI",
      desc: "Locate documents in plain English or tag, star, and sort. The AI search engine translates queries into SQL predicates with strictly zero model training.",
      icon: Sparkles,
    },
    {
      num: "06",
      title: "Preview and download your files.",
      tag: "Instant Delivery",
      desc: "Direct on-demand streaming straight from your Telegram Saved Messages directly to your browser for immediate in-app previewing or rapid download.",
      icon: RefreshCw,
    },
  ];

  const features = [
    {
      title: "Personal File Storage",
      desc: "Store documents, photos, media, and code archives with no artificial storage caps, leveraging Telegram's resilient personal storage layer.",
      icon: HardDrive,
    },
    {
      title: "Telegram Integration",
      desc: "Direct MTProto session protocol connecting directly to your personal Saved Messages chat. No public channels, no shared bots.",
      icon: Send,
    },
    {
      title: "AI-Powered Search",
      desc: "Search naturally: 'Find PDFs from last week' or 'Show videos larger than 50MB'. Queries are converted to deterministic database filters.",
      icon: Sparkles,
    },
    {
      title: "File Categorization",
      desc: "Automated classification of files into Documents, Images, Videos, Audio, and Archives with immediate filtering and sorting.",
      icon: FolderTree,
    },
    {
      title: "Favorites and Tags",
      desc: "Star your most critical files for instant access and organize project assets with custom, searchable metadata tags.",
      icon: Star,
    },
    {
      title: "File Previews",
      desc: "Instant in-browser modal previews for text, code, images, audio, and documents streamed on demand without local downloads.",
      icon: Eye,
    },
    {
      title: "Analytics",
      desc: "Clear visual breakdowns of your storage footprint, file size distribution, category ratios, and recent upload activity.",
      icon: BarChart3,
    },
    {
      title: "Account Security",
      desc: "Strict multi-tenant database isolation, AES-256-GCM session encryption, salted password hashing, and zero host disk persistence.",
      icon: Shield,
    },
  ];

  const searchExamples = [
    "Find PDFs uploaded last week",
    "Show my largest files",
    "Find my college project documents",
    "Show images uploaded this month",
    "Find presentation files",
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
                an unlimited, sovereign private cloud drive. Upload without host disk storage, search with
                ephemeral privacy-first AI, and take absolute sovereignty over your files.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm min-h-[48px]"
                >
                  Create StorageVault Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-semibold px-7 py-3.5 rounded-xl transition text-sm min-h-[48px]"
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

      {/* Feature Sections (All 8 Required Features) */}
      <section id="features" className="py-24 border-b border-neutral-800/60 bg-neutral-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              Comprehensive Platform Features
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Engineered for Speed, Clarity & Sovereignty
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Every tool required to store, search, organize, and safeguard your files without recurring storage surcharges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-600 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-neutral-850 border border-neutral-750 flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-neutral-200" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive 6-Step Workflow */}
      <section id="how-it-works" className="py-24 border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              End-to-End Lifecycle
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              How StorageVault Works
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              An elegant six-step workflow delivering complete sovereign storage with zero permanent server overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700 text-white group-hover:scale-105 transition-transform">
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

      {/* AI Search Section with 3D Neural Mesh */}
      <section id="ai-search" className="py-24 border-b border-neutral-800/60 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left AI Description */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                NATURAL LANGUAGE DISCOVERY
              </div>

              <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Search Your Files <br />
                <span className="text-neutral-400">In Natural Human Language</span>
              </h3>

              <p className="text-sm text-neutral-400 leading-relaxed">
                The StorageVault AI search engine parses conversational inquiries into deterministic SQL predicates.
                Zero training on your private files, zero permanent memory retention, and strictly restricted to your authorized account.
              </p>

              {/* Sample Queries */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Example queries:</span>
                <div className="flex flex-wrap gap-2">
                  {searchExamples.map((ex, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono hover:border-neutral-600 transition"
                    >
                      &ldquo;{ex}&rdquo;
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/ai-search"
                  className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-6 py-3 rounded-xl text-xs transition min-h-[44px]"
                >
                  Try AI Search
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 3D Neural Orb */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full max-w-[420px] aspect-square rounded-3xl bg-neutral-950/80 border border-neutral-800/80 p-4 shadow-2xl relative">
                <NodeMesh3D className="w-full h-full" isSearching={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant Security Section */}
      <section id="security" className="py-24 border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              True Tenant Isolation
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Cryptographic Account Separation
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              StorageVault connects directly to your personal Telegram Saved Messages.
              No shared bot channels, no group chats, and strict database query scoping by user ID.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* User A Sandbox */}
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
                  <span>StorageVault User A (Salted bcrypt)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Telegram Session A (AES-256-GCM at rest)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Personal Saved Messages A (Direct Stream)</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                User A has cryptographic exclusivity. All queries are strictly scoped by <code>ownerUserId</code> in PostgreSQL.
              </p>
            </div>

            {/* User B Sandbox */}
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
                  <span>StorageVault User B (Salted bcrypt)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Telegram Session B (AES-256-GCM at rest)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Personal Saved Messages B (Direct Stream)</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                User B cannot access, view, or discover User A data. Total zero-leakage guarantee across partitions.
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
