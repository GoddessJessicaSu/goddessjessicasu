"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  const [ageVerified, setAgeVerified] = useState(true); // default true to avoid flash

  useEffect(() => {
    const verified = localStorage.getItem("age_verified");
    if (!verified) {
      setAgeVerified(false);
    }
  }, []);

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

  const handleAgeConfirm = () => {
    localStorage.setItem("age_verified", "true");
    setAgeVerified(true);
  };

  return (
    <html lang="en">
      <head>
        <title>{brand.siteName}</title>
        <meta name="description" content={brand.tagline} />
      </head>
      <body className="antialiased min-h-screen">
        {/* 18+ Age Gate */}
        <AnimatePresence>
          {!ageVerified && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-full max-w-sm mx-6 text-center"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                <div className="card-luxury rounded-lg p-10">
                  {/* 18+ badge */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-accent/60 flex items-center justify-center">
                    <span className="font-heading text-accent text-xl font-bold">18+</span>
                  </div>

                  <p className="font-heading text-primary/50 text-[10px] tracking-[0.4em] uppercase mb-4">
                    Age Verification
                  </p>
                  <h2 className="font-heading text-2xl text-gold-shimmer mb-4">
                    Adults Only
                  </h2>
                  <div className="w-10 h-px bg-primary/20 mx-auto mb-5" />

                  <p className="text-foreground/40 text-sm leading-relaxed mb-8">
                    This website contains age-restricted content. By entering, you confirm that you are at least
                    <span className="text-foreground/70 font-medium"> 18 years of age</span> and that viewing such
                    content is legal in your jurisdiction.
                  </p>

                  <button
                    onClick={handleAgeConfirm}
                    className="w-full py-3.5 text-sm tracking-[0.2em] rounded transition-all duration-300 btn-crimson mb-4"
                  >
                    I Am 18 or Older — Enter
                  </button>

                  <a
                    href="https://google.com"
                    className="text-foreground/20 text-[10px] tracking-[0.15em] uppercase hover:text-foreground/40 transition-colors duration-300"
                  >
                    Leave this site
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="fixed top-0 w-full z-50 bg-vanta/90 backdrop-blur-xl border-b border-gold">
          <div className="w-full px-96 h-18 flex items-center justify-between">
            <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity duration-300">
              <img src="/logo.svg" alt="Goddess Jessica Su" className="h-12 w-auto" />
            </Link>
            <div className="flex gap-8 items-center text-[11px] font-sans font-light tracking-[0.2em] uppercase">
              <Link href="/about" className="nav-link text-foreground/40 hover:text-primary">
                About
              </Link>
              <Link href="/gallery" className="nav-link text-foreground/40 hover:text-primary">
                Masterpieces
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

        {/* Footer */}
        <footer className="border-t border-gold/10 mt-20">
          <div className="max-w-7xl mx-auto px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <span className="text-foreground/15 text-[10px] tracking-[0.2em] uppercase font-heading">
                  &copy; {new Date().getFullYear()} {brand.siteName}. All rights reserved.
                </span>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/terms"
                  className="text-foreground/20 text-[10px] tracking-[0.15em] uppercase hover:text-primary/50 transition-colors duration-300"
                >
                  Terms &amp; Conditions
                </Link>
                <span className="text-foreground/10">|</span>
                <span className="text-foreground/15 text-[10px] tracking-[0.15em] uppercase">
                  18+ Only
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
