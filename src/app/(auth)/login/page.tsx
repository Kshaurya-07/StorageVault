"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import VaultEmblem3D from "@/components/3d/VaultEmblem3D";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand with 3D Vault Emblem */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1 mb-2 group">
            <VaultEmblem3D size={68} className="mb-2 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-2xl tracking-tight text-white">
              Storage<span className="text-neutral-400 font-medium">Vault</span>
            </span>
          </Link>
          <h2 className="text-base font-bold text-white">Sign In to Your Vault</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Access your personal Telegram-backed sovereign cloud
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl border border-neutral-800 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center gap-2 text-neutral-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-neutral-400 hover:text-white hover:underline transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl shadow-lg transition text-sm min-h-[48px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-400">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="text-white font-semibold hover:underline">
              Create StorageVault account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
