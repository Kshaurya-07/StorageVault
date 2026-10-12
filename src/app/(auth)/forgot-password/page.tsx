"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { HardDrive, Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";

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
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 selection:bg-blue-600">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              VAULT <span className="text-blue-400">AI</span>
            </span>
          </Link>
          <h2 className="text-lg font-bold text-white">
            {token ? "Set New Password" : "Reset Account Password"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {token
              ? "Create a strong new password for your account"
              : "Enter your account email to receive reset instructions"}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          {status && (
            <div
              className={`mb-6 p-3.5 rounded-xl border flex items-center gap-2 text-xs ${
                status.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {devResetUrl && (
            <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-blue-200">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Dev Mode: Instant Reset Link</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Because no SMTP server is configured, click below to test the reset flow:
              </p>
              <Link
                href={devResetUrl}
                className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                Proceed to Reset Password &rarr;
              </Link>
            </div>
          )}

          {token ? (
            /* Step 2: Form with token present */
            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="New password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#11192e] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#11192e] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition text-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Set New Password</span>
                )}
              </button>
            </form>
          ) : (
            /* Step 1: Request reset link by email */
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#11192e] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition text-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-medium"
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
    <Suspense fallback={<div className="min-h-screen bg-[#090d16] flex items-center justify-center text-white text-xs">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
