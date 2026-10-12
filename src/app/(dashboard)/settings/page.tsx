"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
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
    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "New password must be at least 8 characters long." });
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

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (res.ok) {
        alert("Your account and all associated data have been permanently deleted.");
        router.push("/register");
      } else {
        alert("Failed to delete account.");
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

      <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
        {msg && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs ${
              msg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profile Details</h3>
              <p className="text-xs text-slate-400">Your account identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Full Name
              </span>
              <span className="text-white font-medium">
                {user?.name || "Not set"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Email Address
              </span>
              <span className="text-white font-medium">{user?.email || "..."}</span>
            </div>
          </div>
        </div>

        {/* Telegram Connection Management Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Telegram Cloud Connection</h3>
                <p className="text-xs text-slate-400">
                  {tgStatus.connected
                    ? `Linked to personal Telegram account (@${tgStatus.username || "Saved Messages"})`
                    : "No Telegram account currently linked"}
                </p>
              </div>
            </div>

            <Link
              href="/connect-telegram"
              className="px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-xs font-semibold transition"
            >
              {tgStatus.connected ? "Manage Connection" : "Connect Now"}
            </Link>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Change Password</h3>
              <p className="text-xs text-slate-400">
                Update your vault authentication password
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="•••••••• (if previously set)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="•••••••• (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2"
            >
              {updatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="rounded-3xl p-6 bg-rose-950/20 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-300">Danger Zone: Delete Account</h3>
              <p className="text-xs text-slate-400">
                Permanently purge your account, database records, and active sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400 max-w-lg">
              Files already existing in your Telegram Saved Messages will remain in your
              Telegram app, but all indexed metadata and sessions in VAULT AI will be wiped permanently.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition"
            >
              {deletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
