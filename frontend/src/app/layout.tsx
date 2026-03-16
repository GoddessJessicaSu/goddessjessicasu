"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { brand } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>{brand.siteName}</title>
        <meta name="description" content={brand.tagline} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-primary font-bold text-xl tracking-wide">
              {brand.siteName}
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/auth/magic-link" className="hover:text-primary transition-colors">Sign In</Link>
            </div>
          </div>
        </nav>
        <main className="pt-16">
          <AnimatePresence mode="wait">
            <div key={pathname}>
              {children}
            </div>
          </AnimatePresence>
        </main>
      </body>
    </html>
  );
}
