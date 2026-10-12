"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Bridge3DConduit from "@/components/3d/Bridge3DConduit";
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  KeyRound,
  Lock,
  Loader2,
  LogOut,
} from "lucide-react";

export default function ConnectTelegramPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Connection status from server
  const [status, setStatus] = useState<{
    connected: boolean;
    status: string;
    telegramUserId?: string;
    telegramUsername?: string;
    telegramFirstName?: string;
    phoneNumber?: string;
    connectedAt?: string;
    mode: "real" | "mock";
  }>({
    connected: false,
    status: "DISCONNECTED",
    mode: "mock",
  });

  // Flow steps: "phone" | "code" | "2fa" | "connected"
  const [step, setStep] = useState<"phone" | "code" | "2fa" | "connected">("phone");

  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.connected) {
          setStep("connected");
        } else if (data.status === "PENDING_CODE") {
          setStep("code");
        } else if (data.status === "PENDING_2FA") {
          setStep("2fa");
        } else {
          setStep("phone");
        }
      }
    } catch {
      setError("Failed to fetch Telegram connection status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/telegram/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send confirmation code.");
      } else {
        setSuccessMsg("Confirmation code sent! Please check your Telegram app.");
        setStep("code");
      }
    } catch {
      setError("Network error sending confirmation code.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/telegram/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
      } else if (data.needs2FA) {
        setStep("2fa");
        setSuccessMsg("Two-step verification cloud password required.");
      } else {
        setSuccessMsg("Telegram account connected successfully!");
        fetchStatus();
      }
    } catch {
      setError("Network error verifying confirmation code.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Verify 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/telegram/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: cloudPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "2FA verification failed.");
      } else {
        setSuccessMsg("2FA verified and account connected!");
        fetchStatus();
      }
    } catch {
      setError("Network error during 2FA verification.");
    } finally {
      setSubmitting(false);
    }
  };

  // Disconnect Telegram
  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect your Telegram account? Files in your Telegram Saved Messages will remain safe, but you won't be able to upload or download through StorageVault until reconnected."
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/telegram/disconnect", { method: "POST" });
      if (res.ok) {
        setSuccessMsg("Telegram account disconnected.");
        setStep("phone");
        fetchStatus();
      }
    } catch {
      setError("Failed to disconnect account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Connect Telegram Account" />

      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* 3D Conduit Visualizer Header */}
        <div className="p-6 rounded-3xl glass-panel border border-neutral-800 relative overflow-hidden">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Personal Saved Messages Integration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  MTProto Layer ({status.mode.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                StorageVault connects to your personal Telegram account using official MTProto protocols.
                Every file you upload is dispatched directly to your <strong>Saved Messages</strong> chat.
                Your session string is sealed at rest using AES-256-GCM.
              </p>
            </div>
          </div>

          <Bridge3DConduit connected={status.connected} />
        </div>

        {/* Status Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center gap-2.5 text-xs text-neutral-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center gap-2.5 text-xs text-neutral-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Connection Flow Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
              <p className="text-xs text-neutral-400">Verifying Telegram MTProto session...</p>
            </div>
          ) : step === "connected" ? (
            /* Connected State */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Telegram Connected
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Files are securely routed to your personal Saved Messages
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>

              {/* Active Account Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                    Telegram User
                  </span>
                  <span className="text-white font-medium">
                    {status.telegramFirstName || "StorageVault User"} (
                    {status.telegramUsername ? `@${status.telegramUsername}` : "No username"}
                    )
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                    Phone Number
                  </span>
                  <span className="text-white font-mono">
                    {status.phoneNumber || "Masked"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                    Connected Since
                  </span>
                  <span className="text-white font-medium">
                    {status.connectedAt
                      ? new Date(status.connectedAt).toLocaleDateString()
                      : "Active"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3 text-xs text-neutral-300">
                <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                <span>
                  Your MTProto StringSession is sealed at rest using AES-256-GCM.
                  Your credentials are never logged or shared across users.
                </span>
              </div>
            </div>
          ) : step === "phone" ? (
            /* Step 1: Phone Number */
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-base font-bold text-white mb-1">
                  Step 1: Enter your Telegram Phone Number
                </h3>
                <p className="text-xs text-neutral-400">
                  Telegram will send an official confirmation code to your Telegram app.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Phone Number with Country Code
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Include country code (+1 for US, +91 for India, +44 for UK, etc.)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-semibold py-3 rounded-xl shadow-md transition text-xs disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            </div>
          ) : step === "code" ? (
            /* Step 2: Verification Code */
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-base font-bold text-white mb-1">
                  Step 2: Enter Telegram Confirmation Code
                </h3>
                <p className="text-xs text-neutral-400">
                  Check your Telegram app for the official login code.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Confirmation Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12345"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 tracking-widest text-center font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="w-1/3 py-2.5 rounded-xl border border-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-semibold py-2.5 rounded-xl shadow-md transition text-xs disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <span>Verify & Connect</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Step 3: Two-step password (2FA) */
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-base font-bold text-white mb-1">
                  Step 3: Two-Step Verification
                </h3>
                <p className="text-xs text-neutral-400">
                  Your Telegram account has 2FA enabled. Enter your Telegram cloud password.
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Telegram Cloud Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={cloudPassword}
                      onChange={(e) => setCloudPassword(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("code")}
                    className="w-1/3 py-2.5 rounded-xl border border-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-semibold py-2.5 rounded-xl shadow-md transition text-xs disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <span>Authorize 2FA</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
