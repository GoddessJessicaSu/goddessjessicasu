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
      transition={{ duration: 0.8 }}
    >
      {/* Hero */}
      <section className="min-h-screen relative flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
          {/* Top-left fade for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-vanta/70 via-transparent to-transparent w-1/2" />
          <div className="absolute inset-0 bg-gradient-to-b from-vanta/60 via-transparent to-transparent h-2/3" />
          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-vanta via-transparent to-transparent" />
          {/* Spotlight — brighter center, dark edges */}
          <div className="absolute inset-0 bg-radial-[ellipse_at_55%_50%] from-transparent via-transparent to-vanta/70" />
          {/* Warm center glow on the subject */}
          <div className="absolute inset-0 bg-radial-[ellipse_at_55%_55%] from-primary/4 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full px-96 pb-32 -mt-12">
          <div className="max-w-lg">
            {/* Decorative line */}
            <motion.div
              className="w-16 h-px bg-primary/50 mb-8"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />

            {/* Tagline — small, airy, sans-serif */}
            <motion.p
              className="font-sans font-light text-primary/60 text-[10px] tracking-[0.45em] uppercase mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Exclusive &bull; Untouchable &bull; Divine
            </motion.p>

            {/* Heading — signature calligraphy */}
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-10"
            >
              <img
                src="/logo.svg"
                alt="Goddess Jessica Su"
                className="h-24 sm:h-28 md:h-36 lg:h-44 w-auto"
              />
            </motion.h1>

            {/* Tagline with crypto-luxe styling */}
            <motion.p
              className="text-base md:text-lg text-foreground/40 max-w-md mb-12 leading-relaxed font-light flex items-center gap-3"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span>Exclusive Content, Unlocked by <span className="font-mono-tech text-primary/70">Crypto</span></span>
              <span className="dot-live" />
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-5"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Link
                href="/gallery"
                className="btn-gold px-12 py-4 text-[11px] text-center"
              >
                Claim Access
              </Link>
              <Link
                href="/dashboard"
                className="btn-ghost-gold px-12 py-4 text-[11px] text-center"
              >
                My Dashboard
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-vanta to-transparent" />
      </section>

      {/* Divider */}
      <div className="divider-gold" />

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-8 py-32">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="font-sans font-light text-primary/40 text-[10px] tracking-[0.5em] uppercase mb-4">The Ritual</p>
          <h2 className="font-heading text-3xl md:text-4xl text-gold-shimmer font-normal tracking-[0.1em]">How It Works</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            { step: "I", title: "Enter", desc: "Provide your email to receive a magic link. No passwords. No friction." },
            { step: "II", title: "Acquire", desc: `Pay with any cryptocurrency. Receive ${brand.tokenName} tokens to your vault instantly.` },
            { step: "III", title: "Unlock", desc: `Spend ${brand.tokenName} tokens to access exclusive, premium content.` },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              className="text-center group"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="font-heading text-3xl text-primary/20 mb-6 group-hover:text-primary/50 transition-colors duration-500 tracking-wider">
                {item.step}
              </div>
              <div className="w-8 h-px bg-primary/20 mx-auto mb-6" />
              <h3 className="font-heading text-lg text-primary/80 tracking-[0.2em] uppercase mb-3 font-normal">{item.title}</h3>
              <p className="text-foreground/35 text-sm leading-relaxed font-light">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="divider-gold" />

      {/* Custom Video CTA */}
      <section className="max-w-5xl mx-auto px-8 py-32 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="font-sans font-light text-primary/40 text-[10px] tracking-[0.5em] uppercase mb-4">By Request Only</p>
          <h2 className="font-heading text-3xl md:text-4xl text-gold-shimmer mb-6 font-normal tracking-[0.1em]">Custom Videos</h2>
          <p className="text-foreground/35 max-w-lg mx-auto mb-10 leading-relaxed font-light">
            Desire something crafted exclusively for you? Commission a custom piece.
            Pricing in <span className="font-mono-tech text-primary/60">{brand.tokenName}</span> tokens.
          </p>
          <div className="w-12 h-px bg-primary/20 mx-auto" />
        </motion.div>
      </section>
    </motion.div>
  );
}
