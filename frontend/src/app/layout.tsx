"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import api from "@/lib/api";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.get("/auth/me")
      .then((res) => {
        setIsLoggedIn(true);
        setDisplayName(res.data.user.username || null);
      })
      .catch(() => {
        // Token invalid/expired
      });
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setDisplayName(null);
    window.location.href = "/";
  };

  return (
    <html lang="en">
      <head>
        <title>{brand.siteName}</title>
        <meta name="description" content={brand.tagline} />
      </head>
      <body className="antialiased min-h-screen">
        <nav className="fixed top-0 w-full z-50 bg-vanta/90 backdrop-blur-xl border-b border-gold">
          <div className="w-full px-96 h-18 flex items-center justify-between">
            <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity duration-300">
              <img src="/logo.svg" alt="Goddess Jessica Su" className="h-12 w-auto" />
            </Link>
            <div className="flex gap-8 items-center text-[11px] font-sans font-light tracking-[0.2em] uppercase">
              <Link href="/gallery" className="nav-link text-foreground/40 hover:text-primary">
                Gallery
              </Link>
              <Link href="/dashboard" className="nav-link text-foreground/40 hover:text-primary">
                Dashboard
              </Link>
              {isLoggedIn ? (
                <>
                  {displayName && (
                    <span className="text-primary/60 text-[10px] tracking-[0.15em] normal-case">
                      {displayName}
                    </span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="nav-link text-foreground/40 hover:text-primary"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth/magic-link" className="nav-link text-foreground/40 hover:text-primary">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
        <main className="pt-18">
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
