"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";
import VaultEmblem3D from "@/components/3d/VaultEmblem3D";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setDevResetUrl(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({
          success: true,
          message: data.message || "Password reset instructions have been processed.",
        });
        if (data.resetUrl) {
          setDevResetUrl(data.resetUrl);
        }
      } else {
        setStatus({ success: false, message: data.error || "Failed to process request." });
      }
    } catch {
      setStatus({ success: false, message: "Network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ success: false, message: "Password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ success: false, message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({
          success: true,
          message: data.message || "Your password has been successfully reset. You may now log in.",
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus({ success: false, message: data.error || "Failed to reset password." });
      }
    } catch {
      setStatus({ success: false, message: "Network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex items-center justify-center p-6 selection:bg-neutral-800 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand with 3D Vault Emblem */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1 mb-2 group">
            <VaultEmblem3D size={68} className="mb-2 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-2xl tracking-tight text-white">
              Storage<span className="text-neutral-400 font-medium">Vault</span>
            </span>
          </Link>
          <h2 className="text-base font-bold text-white">
            {token ? "Set New Password" : "Reset Vault Password"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {token
              ? "Create a strong new password for your account"
              : "Enter your account email to receive reset instructions"}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-neutral-800 shadow-2xl">
          {status && (
            <div
              className={`mb-6 p-3.5 rounded-xl border flex items-center gap-2 text-xs ${
                status.success
                  ? "bg-neutral-900 border-neutral-700 text-neutral-200"
                  : "bg-neutral-900 border-neutral-700 text-neutral-300"
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {devResetUrl && (
            <div className="mb-6 p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-300 space-y-2 font-mono">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Local Dev Reset Link:</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Because no SMTP server is configured in dev, click below:
              </p>
              <Link
                href={devResetUrl}
                className="inline-block text-white hover:underline text-[11px] break-all"
              >
                {devResetUrl}
              </Link>
            </div>
          )}

          {!token ? (
            /* Request Reset Link Form */
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold py-3 rounded-xl shadow-md transition text-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          ) : (
            /* Execute Reset Form */
            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="•••••••• (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold py-3 rounded-xl shadow-md transition text-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
