import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StorageVault - Cloud Storage Powered by Your Personal Telegram",
  description:
    "StorageVault turns your personal Telegram account's Saved Messages into an unlimited, zero-knowledge private cloud drive. Fast, encrypted, sovereign, and privacy-first AI search.",
  keywords: [
    "storagevault",
    "cloud storage",
    "telegram saved messages",
    "encrypted storage",
    "zero knowledge",
    "ai file search",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink-900 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
