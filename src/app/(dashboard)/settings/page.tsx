"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Shield3DVault from "@/components/3d/Shield3DVault";
import {
  Settings,
  User,
  Shield,
  Send,
  Trash2,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [tgStatus, setTgStatus] = useState<{
    connected: boolean;
    username?: string;
    phoneNumber?: string;
  }>({ connected: false });

  const [loading, setLoading] = useState(true);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/auth/me"), fetch("/api/telegram/status")])
      .then(async ([resMe, resTg]) => {
        if (resMe.ok) {
          const d = await resMe.json();
          if (d.authenticated) setUser(d.user);
        }
        if (resTg.ok) {
          const t = await resTg.json();
          setTgStatus(t);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentPassword) {
      setMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword.length > 72) {
      setMsg({ type: "error", text: "New password must not exceed 72 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPassword || undefined, newPassword }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMsg({ type: "error", text: d.error || "Failed to update password." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "CAUTION: Deleting your account will remove your metadata, indexes, and session credentials. Type 'DELETE' to confirm:"
    );
    if (confirmation !== "DELETE") return;
    // Password re-confirmation is required by the API for this destructive action.
    const password = prompt("Enter your current password to permanently delete your account:");
    if (!password) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
      });
      if (res.ok) {
        alert("Your account and all associated data have been permanently deleted.");
        router.push("/register");
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to delete account.");
      }
    } catch {
      alert("Error deleting account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <Header title="Account Settings" />

      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {msg && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs ${
              msg.type === "success"
                ? "bg-neutral-900 border-neutral-700 text-neutral-200"
                : "bg-neutral-900 border-neutral-700 text-neutral-300"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* 3D Security Posture Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cryptographic Key Management</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Zero-Knowledge Vault Perimeter
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Your StorageVault session credentials and PostgreSQL metadata partitions are protected with authenticated AES-256-GCM ciphers.
                Files are streamed directly into your Telegram account without persistent disk exposure on our host machines.
              </p>
            </div>
            <div className="md:col-span-4 h-[160px] flex items-center justify-center">
              <Shield3DVault className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-panel rounded-3xl p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profile Details</h3>
              <p className="text-xs text-neutral-400">Your account identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                Full Name
              </span>
              <span className="text-white font-medium">
                {user?.name || "Not set"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                Email Address
              </span>
              <span className="text-white font-medium">{user?.email || "..."}</span>
            </div>
          </div>
        </div>

        {/* Telegram Connection Management Card */}
        <div className="glass-panel rounded-3xl p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Telegram Cloud Connection</h3>
                <p className="text-xs text-neutral-400">
                  {tgStatus.connected
                    ? `Linked to personal Telegram account (@${tgStatus.username || "Saved Messages"})`
                    : "No Telegram account currently linked"}
                </p>
              </div>
            </div>

            <Link
              href="/connect-telegram"
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-semibold transition"
            >
              {tgStatus.connected ? "Manage Connection" : "Connect Now"}
            </Link>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel rounded-3xl p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Change Password</h3>
              <p className="text-xs text-neutral-400">
                Update your vault authentication password
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="•••••••• (if previously set)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="•••••••• (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg min-h-[48px]"
            >
              {updatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="rounded-3xl p-6 bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Danger Zone: Delete Account</h3>
              <p className="text-xs text-neutral-400">
                Permanently purge your account, database records, and active sessions.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs text-neutral-400 max-w-lg">
              Files already existing in your Telegram Saved Messages will remain intact in your
              Telegram app, but all indexed metadata and sessions in StorageVault will be wiped permanently.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition shrink-0"
            >
              {deletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
