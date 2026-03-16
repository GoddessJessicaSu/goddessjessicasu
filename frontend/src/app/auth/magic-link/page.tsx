"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import UsernameSetupModal from "@/components/UsernameSetupModal";

export default function MagicLink() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/request", { email });
      setLinkId(res.data.linkId);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = useCallback((data: any) => {
    localStorage.setItem("token", data.token);
    if (data.needsUsername) {
      setVerifiedEmail(data.user.email);
      setShowUsernameSetup(true);
    } else {
      window.location.href = "/dashboard";
    }
  }, []);

  // Poll for magic link verification
  useEffect(() => {
    if (!linkId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/auth/poll?linkId=${linkId}`);
        if (res.data.status === "verified") {
          if (pollRef.current) clearInterval(pollRef.current);
          handleVerified(res.data);
        }
      } catch {
        // Ignore poll errors
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [linkId, handleVerified]);

  const handleUsernameComplete = () => {
    window.location.href = "/dashboard";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-[80vh] flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-4">
            Private Access
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-gold-shimmer mb-3">
            Sign In
          </h1>
          <div className="w-12 h-px bg-primary/30 mx-auto" />
        </div>

        {sent ? (
          <motion.div
            className="card-luxury rounded-lg p-8 text-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Envelope icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-primary/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="font-heading text-primary text-lg tracking-[0.1em] uppercase mb-3">
              Check Your Email
            </p>
            <p className="text-foreground/40 text-sm leading-relaxed">
              A magic link has been sent to
            </p>
            <p className="text-foreground/70 text-sm font-medium mt-1 mb-4">
              {email}
            </p>
            <div className="w-8 h-px bg-primary/20 mx-auto mb-4" />
            <p className="text-foreground/25 text-xs leading-relaxed mb-5">
              Click the link in your email to sign in. It expires in 15 minutes.
            </p>

            {/* Waiting indicator */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              <span className="text-foreground/20 text-[10px] tracking-[0.2em] uppercase font-heading">
                Waiting for verification
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="card-luxury rounded-lg p-8"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <label className="text-foreground/30 text-xs tracking-[0.15em] uppercase block mb-3">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3.5 bg-vanta/50 border border-gold rounded text-foreground/90 text-sm placeholder:text-foreground/20 focus:border-primary/50 focus:outline-none transition-all duration-300 mb-2"
            />

            {error && (
              <motion.p
                className="text-accent text-xs mb-3"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <div className="h-3" />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-sm tracking-[0.2em] rounded transition-all duration-300 ${
                loading
                  ? "bg-foreground/5 text-foreground/25 cursor-not-allowed font-heading uppercase"
                  : "btn-crimson"
              }`}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>

            <p className="text-foreground/20 text-[10px] text-center mt-5 leading-relaxed tracking-wide">
              We&apos;ll send a secure link to your inbox — no password needed.
            </p>
          </motion.form>
        )}
      </div>

      {showUsernameSetup && (
        <UsernameSetupModal email={verifiedEmail} onComplete={handleUsernameComplete} />
      )}
    </motion.div>
  );
}
