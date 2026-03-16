"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const CUTE_PREFIXES = [
  "Jessica's stray crawfish",
  "Jessica's kitchen cockroach",
  "Jessica's silent locust",
  "Jessica's caged cricket",
  "Jessica's dusty bug",
  "Jessica's corner spider",
  "Jessica's trail-leaving snail",
  "Jessica's bowl-feeding mealworm",
];

function generateRandomUsername(): string {
  const prefix =
    CUTE_PREFIXES[Math.floor(Math.random() * CUTE_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix} #${num}`;
}

function generateSuggestedName(email: string): string {
  const local = email.split("@")[0];
  // Clean up: remove dots, numbers, underscores and capitalize
  const cleaned = local
    .replace(/[._+]/g, " ")
    .replace(/\d+/g, "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return cleaned || "Mystery Guest";
}

interface UsernameSetupModalProps {
  email: string;
  onComplete: (username: string) => void;
}

export default function UsernameSetupModal({
  email,
  onComplete,
}: UsernameSetupModalProps) {
  const [username, setUsername] = useState("");
  const [suggested, setSuggested] = useState("");
  const [randomName, setRandomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSuggested(generateSuggestedName(email));
    setRandomName(generateRandomUsername());
  }, [email]);

  const handleSubmit = async (name: string) => {
    const finalName = name.trim();
    if (!finalName) return;

    setSaving(true);
    setError("");
    try {
      const res = await api.put("/auth/username", { username: finalName });
      onComplete(res.data.user.username);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to set username");
      setSaving(false);
    }
  };

  const handleSkip = () => {
    handleSubmit(randomName);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md mx-4 bg-vanta border border-gold rounded-lg overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Header */}
          <div className="p-8 pb-4">
            <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-3">
              Welcome
            </p>
            <h2 className="font-heading text-2xl text-gold-shimmer mb-2">
              Choose Your Name
            </h2>
            <p className="text-foreground/40 text-sm leading-relaxed">
              Pick a display name that others will see. You can always change it
              later.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 pb-6 space-y-4">
            {/* Suggested name */}
            <div>
              <label className="text-foreground/30 text-xs tracking-[0.15em] uppercase block mb-2">
                Suggested for you
              </label>
              <button
                onClick={() => setUsername(suggested)}
                className="w-full text-left px-4 py-3 rounded border border-gold bg-vanta/50 hover:border-primary/50 transition-all duration-300 group"
              >
                <span className="text-foreground/70 group-hover:text-foreground/90 transition-colors">
                  {suggested}
                </span>
                <span className="text-primary/40 text-xs ml-2">
                  click to use
                </span>
              </button>
            </div>

            {/* Custom input */}
            <div>
              <label className="text-foreground/30 text-xs tracking-[0.15em] uppercase block mb-2">
                Or type your own
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && username.trim())
                    handleSubmit(username);
                }}
                placeholder="Enter a display name..."
                maxLength={30}
                className="w-full px-4 py-3 rounded border border-gold bg-vanta/50 text-foreground/90 placeholder:text-foreground/20 focus:border-primary/50 focus:outline-none transition-all duration-300"
              />
              <div className="flex justify-between mt-1">
                <span className="text-red-400/80 text-xs">{error}</span>
                <span className="text-foreground/20 text-xs">
                  {username.length}/30
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSubmit(username)}
                disabled={!username.trim() || saving}
                className={`flex-1 py-3 text-sm tracking-[0.15em] rounded transition-all duration-300 ${
                  !username.trim() || saving
                    ? "bg-foreground/5 text-foreground/20 cursor-not-allowed font-heading uppercase"
                    : "btn-crimson"
                }`}
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="px-6 py-3 text-sm tracking-[0.15em] rounded border border-gold text-foreground/40 hover:text-foreground/60 hover:border-primary/30 transition-all duration-300 font-heading uppercase"
              >
                Skip
              </button>
            </div>

            {/* Skip explanation */}
            <p className="text-foreground/20 text-xs text-center leading-relaxed">
              Skip to get a random name:{" "}
              <span className="text-primary/40 italic">{randomName}</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
