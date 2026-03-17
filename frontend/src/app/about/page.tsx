"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero section */}
      <div className="text-center pt-16 pb-8 px-6">
        <motion.p
          className="font-heading text-primary/60 text-xs tracking-[0.5em] uppercase mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          The Goddess
        </motion.p>
        <motion.h1
          className="font-heading text-4xl md:text-6xl text-gold-shimmer mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Welcome to My Secret World
        </motion.h1>
        <motion.div
          className="w-16 h-px bg-primary/40 mx-auto"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        {/* Intro */}
        <motion.section
          className="text-center"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-foreground/50 text-base md:text-lg leading-relaxed font-heading">
            I&rsquo;m <span className="text-primary">Jessica Su</span>, 27 years old&hellip; with 20+ years of experience in crushing.
          </p>
          <p className="text-foreground/40 text-base md:text-lg leading-relaxed font-heading mt-2">
            A confident, intelligent, elegant woman &mdash;
          </p>
          <p className="text-foreground/50 text-base md:text-lg leading-relaxed font-heading mt-1">
            but with a dangerous side you&rsquo;re just about to discover.
          </p>
        </motion.section>

        {/* Who I Am */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">Background</p>
            <h2 className="font-heading text-2xl md:text-3xl text-gold-shimmer">Who I Am</h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mt-4" />
          </div>
          <div className="card-luxury rounded-lg p-8 md:p-10 space-y-5">
            <AboutItem icon="🎓" text="Master's degree from a top university" />
            <AboutItem icon="💼" text="Work at one of the world's top banks" />
            <AboutItem icon="👠" text="By day: sharp suits, designer heels, the perfect good girl smile" />
            <AboutItem icon="✨" text="By night: a goddess who has ended 10,000+ tiny lives under her feet" />
          </div>
          <p className="text-center text-foreground/30 text-sm font-heading mt-6 tracking-wide italic">
            They don&rsquo;t know what you&rsquo;re about to learn.
          </p>
        </motion.section>

        {/* Why I'm the Best */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">Excellence</p>
            <h2 className="font-heading text-2xl md:text-3xl text-gold-shimmer">Why I&rsquo;m the Best</h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mt-4" />
          </div>
          <div className="space-y-4">
            <QualityCard
              title="Passion"
              description="I love this. Every stomp, twist, and grind comes from pure instinct & desire."
            />
            <QualityCard
              title="Perfectionist"
              description="From posture to camera angles, every second looks & feels flawless."
            />
            <QualityCard
              title="Always Evolving"
              description="I study filming, psychology, stagecraft. I ask fans what pushes them further."
            />
            <QualityCard
              title="Creative to the Core"
              description="Always inventing new styles, new surprises."
            />
            <QualityCard
              title="$100,000+ Invested"
              description="In luxury heels, nylons, designer outfits. Every dollar felt beneath me."
            />
          </div>
        </motion.section>

        {/* My Legacy */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">History</p>
            <h2 className="font-heading text-2xl md:text-3xl text-gold-shimmer">My Legacy</h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mt-4" />
          </div>
          <div className="card-luxury rounded-lg p-8 md:p-10 text-center space-y-6">
            <p className="text-foreground/60 text-lg font-heading leading-relaxed">
              I&rsquo;ve ended over <span className="text-accent font-semibold">10,000</span> lives.
            </p>
            <p className="text-foreground/40 text-base leading-relaxed">
              And no &mdash; I don&rsquo;t feel guilty. Not for a second.
            </p>
            <div className="w-10 h-px bg-primary/20 mx-auto" />
            <p className="text-foreground/35 text-sm leading-relaxed">Why?</p>
            <p className="text-foreground/50 text-sm leading-[1.8]">
              Because every one of them experienced the ultimate privilege:<br />
              <span className="text-accent font-bold text-lg tracking-wide uppercase">To die under my feet.</span><br />
              <span className="text-foreground/60">Crushed by elegance, beauty, and power.</span>
            </p>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          className="text-center"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-10">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">Your Turn</p>
            <h2 className="font-heading text-2xl md:text-3xl text-gold-shimmer">Enter My World</h2>
            <div className="w-12 h-px bg-primary/30 mx-auto mt-4" />
          </div>

          <div className="card-luxury rounded-lg p-8 md:p-12 space-y-8">
            <div className="flex flex-col items-center gap-4">
              <p className="text-foreground/50 text-base font-heading tracking-wide">Watch.</p>
              <p className="text-foreground/50 text-base font-heading tracking-wide">Worship.</p>
              <p className="text-foreground/50 text-base font-heading tracking-wide">Lose yourself.</p>
            </div>

            <div className="w-10 h-px bg-primary/20 mx-auto" />

            <div className="text-foreground/35 text-sm leading-[2] space-y-1">
              <p>Every stomp.</p>
              <p>Every twist.</p>
              <p>Every slow, merciless grind.</p>
            </div>

            <div className="w-10 h-px bg-primary/20 mx-auto" />

            <p className="text-foreground/60 font-heading text-lg tracking-wide">
              My world is open now.
            </p>
            <p className="text-sm italic text-gold-shimmer">
              Step in&hellip; if you&rsquo;re ready to be stepped on.
            </p>

            <Link
              href="/gallery"
              className="inline-block py-3.5 px-12 text-sm tracking-[0.2em] rounded transition-all duration-300 btn-crimson"
            >
              View Masterpieces
            </Link>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

function AboutItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-foreground/50 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function QualityCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card-luxury rounded-lg p-6 flex items-start gap-5 group hover:glow-gold transition-all duration-500">
      <div className="w-1 h-full min-h-[40px] bg-primary/30 rounded-full flex-shrink-0 group-hover:bg-primary/60 transition-colors duration-500" />
      <div>
        <h3 className="font-heading text-foreground/80 text-sm tracking-[0.1em] uppercase mb-1.5">{title}</h3>
        <p className="text-foreground/40 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
