"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import UsernameSetupModal from "@/components/UsernameSetupModal";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "username-setup" | "error">("loading");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Missing token");
      return;
    }

    api.get(`/auth/verify?token=${token}`)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setEmail(res.data.user.email);

        if (res.data.needsUsername) {
          setStatus("username-setup");
        } else {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        }
      })
      .catch((err) => {
        setStatus("error");
        setError(err.response?.data?.error || "Verification failed");
      });
  }, [searchParams]);

  const handleUsernameComplete = () => {
    setStatus("success");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  };

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-4">
          Verification
        </p>
        <h1 className="font-heading text-3xl md:text-4xl text-gold-shimmer mb-3">
          {status === "error" ? "Access Denied" : "Welcome"}
        </h1>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
      </div>

      {status === "loading" && (
        <motion.div
          className="card-luxury rounded-lg p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-primary/20 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
          </div>
          <p className="font-heading text-foreground/40 text-sm tracking-[0.15em] uppercase">
            Verifying your link
          </p>
        </motion.div>
      )}

      {status === "username-setup" && (
        <motion.div
          className="card-luxury rounded-lg p-8 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-primary/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-heading text-primary text-lg tracking-[0.1em] uppercase mb-3">
            Signed In
          </p>
          <p className="text-foreground/30 text-xs">
            Setting up your profile...
          </p>
          <UsernameSetupModal email={email} onComplete={handleUsernameComplete} />
        </motion.div>
      )}

      {status === "success" && (
        <motion.div
          className="card-luxury rounded-lg p-8 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-primary/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-heading text-primary text-lg tracking-[0.1em] uppercase mb-3">
            Signed In
          </p>
          <div className="w-8 h-px bg-primary/20 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            <span className="text-foreground/20 text-[10px] tracking-[0.2em] uppercase font-heading">
              Redirecting to dashboard
            </span>
          </div>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          className="card-luxury rounded-lg p-8 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-accent/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-heading text-accent text-lg tracking-[0.1em] uppercase mb-3">
            {error}
          </p>
          <div className="w-8 h-px bg-accent/20 mx-auto mb-4" />
          <a
            href="/auth/magic-link"
            className="text-foreground/30 text-xs tracking-[0.15em] uppercase hover:text-primary/60 transition-colors duration-300"
          >
            Try again
          </a>
        </motion.div>
      )}
    </div>
  );
}

export default function Verify() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-[80vh] flex items-center justify-center px-6"
    >
      <Suspense
        fallback={
          <div className="font-heading text-primary/30 text-sm tracking-[0.3em] uppercase">
            Loading...
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </motion.div>
  );
}
