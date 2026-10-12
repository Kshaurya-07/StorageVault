import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAULT AI - Cloud Storage Powered by Your Personal Telegram",
  description:
    "Premium, multi-user, zero-knowledge cloud storage using your own Telegram account's Saved Messages as private cloud storage. Fast, unlimited, encrypted, and AI-powered.",
  keywords: [
    "cloud storage",
    "telegram saved messages",
    "encrypted storage",
    "ai file manager",
    "vault ai",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
