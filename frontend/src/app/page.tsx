"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { brand } from "@/lib/brand";

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-primary mb-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {brand.siteName}
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-white/70 max-w-xl mb-10"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {brand.tagline}
        </motion.p>
        <motion.div
          className="flex gap-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/gallery"
            className="px-8 py-3 bg-primary text-black font-semibold rounded hover:brightness-110 transition"
          >
            Browse Gallery
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 border border-primary text-primary rounded hover:bg-primary/10 transition"
          >
            My Dashboard
          </Link>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-primary mb-12 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Sign In", desc: "Enter your email to receive a magic link. No passwords needed." },
            { step: "2", title: "Buy Tokens", desc: `Pay with any cryptocurrency via our secure payment processor. Get ${brand.tokenName} tokens instantly.` },
            { step: "3", title: "Unlock Content", desc: `Spend ${brand.tokenName} tokens to unlock exclusive videos from the gallery.` },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-black font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-white/60 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Video CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center border-t border-white/5">
        <h2 className="text-3xl font-bold text-primary mb-4">Custom Videos</h2>
        <p className="text-white/60 max-w-lg mx-auto mb-8">
          Want something made just for you? Contact for custom video requests. Pricing in {brand.tokenName} tokens.
        </p>
      </section>
    </motion.div>
  );
}
