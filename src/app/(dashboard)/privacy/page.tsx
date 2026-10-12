"use client";

import Header from "@/components/Header";
import {
  ShieldCheck,
  Lock,
  Cpu,
  EyeOff,
  ServerOff,
  KeyRound,
  FileCheck,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPage() {
  const securityPillars = [
    {
      icon: EyeOff,
      title: "No AI Training on User Files or Queries",
      description:
        "VAULT AI strictly enforces contractual and architectural zero-training policies. Neither your search prompts nor your file metadata are ever used to train or fine-tune machine learning models.",
    },
    {
      icon: ServerOff,
      title: "Zero Permanent Disk Storage",
      description:
        "Our backend servers never store permanent duplicates of your files. During uploads and downloads, streams pass in-flight between your browser and Telegram's MTProto servers and are immediately freed from memory.",
    },
    {
      icon: Lock,
      title: "AES-256-GCM Session Encryption at Rest",
      description:
        "Your Telegram authorization StringSession is encrypted at rest using AES-256-GCM with authenticated tags and random initialization vectors. Plaintext credentials are never committed or logged.",
    },
    {
      icon: KeyRound,
      title: "Strict Multi-Tenant Row-Level Isolation",
      description:
        "Every database query and file streaming operation explicitly filters by the authenticated server session ID. User A can never read, download, search, or delete User B's files, even with manipulated identifiers.",
    },
    {
      icon: Cpu,
      title: "Ephemeral AI Processing & Zero Memory",
      description:
        "AI queries are processed strictly on demand. There is no persistent cross-session conversational memory, no persistent user profiling, and no autonomous background scanning.",
    },
    {
      icon: ShieldCheck,
      title: "Personal Saved Messages Routing",
      description:
        "Unlike insecure bot-based apps that dump all user files into a shared channel, VAULT AI connects to each user's personal Telegram account and operates solely within their private 'Saved Messages' dialogue.",
    },
  ];

  return (
    <>
      <Header title="Privacy & Security Architecture" />

      <main className="p-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Hero Banner */}
        <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                Zero-Knowledge, Sovereign Cloud Architecture
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                VAULT AI was built on the core principle that cloud storage should belong to the
                user. By combining Telegram&apos;s global MTProto infrastructure with strict local
                cryptography and privacy-first AI, your data remains 100% private to you.
              </p>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-white/5 space-y-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Compliance & Guarantees Checklist */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white">System Privacy Guarantees</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              "Owner ID checked on 100% of API endpoints",
              "HttpOnly, SameSite=Lax, Secure session cookies",
              "Telegram bot-only solutions strictly rejected",
              "Decryption keys isolated from client bundles",
              "Instant complete account & session purging",
              "Pre-query isolation before AI prompt formatting",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
