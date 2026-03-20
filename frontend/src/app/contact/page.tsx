"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ContactFAQ() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/magic-link";
      return;
    }
    api.get("/auth/me")
      .then(() => setAuthorized(true))
      .catch(() => {
        window.location.href = "/auth/magic-link";
      });
  }, []);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-heading text-primary/30 text-sm tracking-[0.3em] uppercase">Loading...</div>
      </div>
    );
  }

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
          Get in Touch
        </motion.p>
        <motion.h1
          className="font-heading text-4xl md:text-6xl text-gold-shimmer mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Contact &amp; FAQ
        </motion.h1>
        <motion.div
          className="w-16 h-px bg-primary/40 mx-auto"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        {/* Contact */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">Connect</p>
            <h2 className="font-heading text-2xl md:text-3xl text-gold-shimmer">Reach Me</h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mt-4" />
          </div>
          <div className="space-y-4">
            <ContactCard
              label="Telegram Group"
              value="Join my community"
              href="https://t.me/+Y-GmDHbzgQwyNTIx"
            />
            <ContactCard
              label="Telegram"
              value="@goddessjessicasuu"
              href="https://t.me/goddessjessicasuu"
            />
            <ContactCard
              label="Email"
              value="jessica@goddessjessicasu.art"
              href="mailto:jessica@goddessjessicasu.art"
            />
            <ContactCard
              label="X (Twitter)"
              value="@goddess_jes_su"
              href="https://x.com/goddess_jes_su"
            />
            <ContactCard
              label="Instagram"
              value="@goddessjessicasu"
              href="https://www.instagram.com/goddessjessicasu"
            />
          </div>

          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 px-6 py-4 text-center">
            <p className="text-primary/70 text-sm font-heading tracking-[0.1em]">
              I appreciate courtesy &mdash; polite and respectful messages always get a reply.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">Questions</p>
            <h2 className="font-heading text-2xl md:text-3xl text-gold-shimmer">FAQ</h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mt-4" />
          </div>
          <div className="space-y-4">
            <FAQItem
              question="How do I purchase content?"
              answer="Buy tokens on your Dashboard, then browse the Masterpieces gallery. Click any item to unlock it with your token balance."
            />
            <FAQItem
              question="How do I download after purchasing?"
              answer="After you unlock content, a download link appears immediately. You will also receive an email with the download link (valid for 24 hours)."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept cryptocurrency payments. Choose a token tier on your Dashboard and pay with your preferred crypto."
            />
            <FAQItem
              question="I didn't receive my tokens after payment?"
              answer="Crypto transactions can take a few minutes to confirm. If your tokens haven't arrived after 30 minutes, reach out via Telegram or reply to any of my emails."
            />
            <FAQItem
              question="Can I request custom content?"
              answer="Yes! Reach out via Telegram or email to discuss custom requests. Details and pricing depend on the request."
            />
            <FAQItem
              question="I can't use crypto &mdash; can I still buy?"
              answer="Absolutely! Just email me at jessica@goddessjessicasu.art or message me on Telegram. Tell me which package you'd like and I'll arrange an alternative payment method and manually top up your GRACE balance. I don't want you to miss out."
            />
            <FAQItem
              question="Is my purchase private?"
              answer="Absolutely. All transactions are crypto-based and your account uses only an email address. No identifying information is shared."
            />
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

function ContactCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="card-luxury rounded-lg p-6 flex items-start gap-5 group hover:glow-gold transition-all duration-500">
      <div className="w-1 h-full min-h-[40px] bg-primary/30 rounded-full flex-shrink-0 group-hover:bg-primary/60 transition-colors duration-500" />
      <div>
        <h3 className="font-heading text-foreground/80 text-sm tracking-[0.1em] uppercase mb-1.5">{label}</h3>
        <p className="text-foreground/40 text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="card-luxury rounded-lg p-6 flex items-start gap-5 group hover:glow-gold transition-all duration-500">
      <div className="w-1 h-full min-h-[40px] bg-primary/30 rounded-full flex-shrink-0 group-hover:bg-primary/60 transition-colors duration-500" />
      <div>
        <h3 className="font-heading text-foreground/80 text-sm tracking-[0.1em] uppercase mb-1.5">{question}</h3>
        <p className="text-foreground/40 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}
