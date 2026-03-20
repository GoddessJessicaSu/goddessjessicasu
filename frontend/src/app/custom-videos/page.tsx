"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CustomVideos() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero */}
      <div className="text-center pt-16 pb-8 px-6">
        <motion.p
          className="font-heading text-primary/60 text-xs tracking-[0.5em] uppercase mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          By Request Only
        </motion.p>
        <motion.h1
          className="font-heading text-4xl md:text-6xl text-gold-shimmer mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Custom Fantasy Videos
        </motion.h1>
        <motion.div
          className="w-16 h-px bg-primary/40 mx-auto"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Intro */}
        <motion.div
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-foreground/40 text-sm leading-relaxed font-light max-w-lg mx-auto">
            Ready to turn your fantasy into reality?
            Let me bring it to life &mdash; exactly the way you imagine.
          </p>
          <p className="text-foreground/35 text-sm leading-relaxed font-light max-w-lg mx-auto mt-4">
            I create exclusive, custom-made videos for those who know what they want.
            And when your secret desire meets my elegant expression&hellip;
            it becomes unforgettable.
          </p>
        </motion.div>

        {/* Tell Me Everything */}
        <motion.div
          className="card-luxury rounded-lg p-8"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-primary/80 text-sm tracking-[0.25em] uppercase mb-6 text-center">Tell Me Everything</h2>
          <div className="flex flex-col items-center gap-3 text-foreground/40 text-sm">
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f460;</span> Shoes, socks, nylons</div>
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f457;</span> Outfits, roleplay, storylines</div>
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f525;</span> Crushing style &mdash; slow, playful, brutal, seductive&hellip;</div>
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f4ac;</span> The more details you share, the deeper I can dive into your fantasy</div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          className="card-luxury rounded-lg p-8"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-primary/80 text-sm tracking-[0.25em] uppercase mb-6 text-center">Pricing</h2>
          <p className="text-foreground/40 text-sm leading-relaxed mb-4">
            <span className="text-primary font-heading tracking-[0.1em]">Starting from $150</span> &mdash; choose your desired outfits and victims.
          </p>
          <p className="text-foreground/35 text-xs tracking-wide mb-4 uppercase font-heading">Extra options available:</p>
          <div className="space-y-2.5 text-foreground/40 text-sm">
            <div className="flex items-start gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f3d6;&#xfe0f;</span> Outdoor shooting &mdash; more space, more impact (highly recommended!)</div>
            <div className="flex items-start gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f399;</span> Verbal &amp; unique kinks</div>
            <div className="flex items-start gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f41e;</span> Choice of &ldquo;lucky boys&rdquo; &mdash; from common (cockroaches, locust, crawfish&hellip;) to exotic (tarantula, scorpion, hissing roaches&hellip;)</div>
            <div className="flex items-start gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f485;</span> Barefoot play (need to discuss in detail)</div>
          </div>
          <p className="text-foreground/30 text-xs mt-5 leading-relaxed italic">
            Special requests may adjust the final tribute &mdash; just reach out and we&apos;ll shape it together.
          </p>
        </motion.div>

        {/* What You Get */}
        <motion.div
          className="card-luxury rounded-lg p-8"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-primary/80 text-sm tracking-[0.25em] uppercase mb-6 text-center">What You Get</h2>
          <div className="flex flex-col items-center gap-3 text-foreground/40 text-sm">
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f4f9;</span> Multi-angle filming</div>
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f4ab;</span> 4K quality</div>
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x1f451;</span> Elegant styling</div>
            <div className="flex items-center gap-3"><span className="text-primary/50 flex-shrink-0 w-6 text-center">&#x26a1;</span> Delivered with power &amp; precision</div>
          </div>
          <div className="w-12 h-px bg-primary/20 mx-auto mt-6 mb-4" />
          <p className="text-foreground/30 text-xs text-center tracking-wide">
            Delivery: 2&ndash;4 weeks. Perfection takes time &mdash; and you&apos;ll feel it every second.
          </p>
        </motion.div>

        {/* Closing + CTA */}
        <motion.div
          className="text-center pt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-foreground/40 text-sm leading-relaxed mb-2 font-light">
            Yes, it&apos;s a little expensive. But the quality speaks for itself.
          </p>
          <p className="text-foreground/45 text-sm leading-relaxed mb-8 font-light">
            So&hellip; are you ready to stop dreaming and start owning?
          </p>
          <p className="font-heading text-primary/60 text-sm tracking-[0.15em] italic mb-8">
            &ldquo;Tell me your dream &mdash; and I&apos;ll make it real.&rdquo;
          </p>
          <Link
            href="/contact"
            className="btn-gold px-12 py-4 text-[11px] inline-block text-center"
          >
            Contact Me to Order
          </Link>
          <p className="text-foreground/25 text-xs mt-4 tracking-wide">
            Find all my contact details on the{" "}
            <Link href="/contact" className="text-primary/50 hover:text-primary/70 transition-colors">
              Contact page
            </Link>.
          </p>
          <div className="mt-10">
            <p className="text-foreground/30 text-sm italic font-light">
              With love, Jessica &#x1f460;
            </p>
            <p className="text-primary/40 text-xs tracking-[0.2em] mt-1 font-heading uppercase">
              The Goddess who lives in your dreams
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
