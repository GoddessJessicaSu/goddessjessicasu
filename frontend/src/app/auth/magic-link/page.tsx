"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";

export default function MagicLink() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/request", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">{brand.siteName}</h1>
        <p className="text-white/50 text-center mb-8">Sign in with your email</p>

        {sent ? (
          <div className="bg-white/5 rounded-lg p-6 border border-primary/30 text-center">
            <div className="text-primary text-2xl mb-2">Check your email</div>
            <p className="text-white/60">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded mb-4 text-white placeholder:text-white/30 focus:border-primary focus:outline-none transition"
            />
            {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-black font-semibold rounded hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
