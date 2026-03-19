"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";

interface UserInfo {
  id: number;
  email: string;
  username: string | null;
  tokenBalance: number;
}

interface VaultItem {
  id: string;
  title: string;
  tokensSpent: number;
  purchasedAt: string;
}

interface TierInfo {
  id: string;
  priceUsd: number;
  tokenAmount: number;
  promoTokenAmount: number | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierInfo | null>(null);
  const [depositPending, setDepositPending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/magic-link";
      return;
    }

    Promise.all([
      api.get("/auth/me"),
      api.get("/purchase/vault"),
      api.get("/deposit/tiers"),
    ])
      .then(([userRes, vaultRes, tiersRes]) => {
        setUser(userRes.data.user);
        setVault(vaultRes.data.items);
        setTiers(tiersRes.data.tiers);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          window.location.href = "/auth/magic-link";
        } else {
          setError(err.response?.data?.error || "Failed to load dashboard");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const initiateDeposit = async () => {
    if (!selectedTier || depositPending) return;
    setDepositPending(true);
    try {
      const res = await api.post("/deposit/initiate", {
        tierId: selectedTier.id,
      });
      window.open(res.data.invoiceUrl, "_blank");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate payment");
      setDepositPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-heading text-primary/30 text-sm tracking-[0.3em] uppercase">
          Loading...
        </div>
      </div>
    );
  }
  if (error) return <div className="p-12 text-accent">{error}</div>;
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16"
    >
      {/* Header */}
      <div className="mb-12">
        <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-4">
          Private Quarters
        </p>
        <h1 className="font-heading text-4xl md:text-5xl text-gold-shimmer mb-3">
          Dashboard
        </h1>
        <p className="text-foreground/30 text-sm">
          {user.username || user.email}
        </p>
        <div className="w-16 h-px bg-primary/30 mt-6" />
      </div>

      {/* Balance Card */}
      <motion.div
        className="card-luxury rounded-lg p-5 sm:p-8 mb-8 relative overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Subtle gold radial behind the number */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-[ellipse] from-primary/5 to-transparent" />

        <div className="relative">
          <p className="font-heading text-foreground/40 text-xs tracking-[0.3em] uppercase mb-4">
            Your Balance
          </p>
          <div className="flex items-baseline gap-4">
            <span className="font-heading text-4xl sm:text-6xl md:text-7xl text-gold-shimmer leading-none">
              {user.tokenBalance.toLocaleString()}
            </span>
            <span className="font-heading text-primary/50 text-lg tracking-[0.2em] uppercase">
              {brand.tokenName}
            </span>
          </div>
        </div>
      </motion.div>

      {/* What is GRACE */}
      <motion.div
        className="card-luxury rounded-lg p-8 md:p-10 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-2">
          The Currency
        </p>
        <h2 className="font-heading text-xl text-primary tracking-[0.1em] mb-6">
          What is {brand.tokenName}?
        </h2>
        <div className="space-y-4 text-foreground/45 text-sm leading-[1.9]">
          <p>
            Beneath my sharp heels, every crush is an act of art. To enter my
            world, you must collect my{" "}
            <strong className="text-primary font-semibold">
              {brand.tokenName}
            </strong>
            . Think of each token as a{" "}
            <strong className="text-foreground/70">
              small fragment of the power
            </strong>{" "}
            I leave behind on the floor after I am done.
          </p>
          <p>
            Use your{" "}
            <strong className="text-primary font-semibold">
              {brand.tokenName}
            </strong>{" "}
            to unlock my{" "}
            <strong className="text-foreground/70">
              private library of destruction
            </strong>
            . As you offer these fragments to me, you mend the shattered images
            of my work. Collect enough, and the{" "}
            <strong className="text-foreground/70">
              full elegance of the crush
            </strong>{" "}
            will finally be yours to witness.
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-gold/10 text-center">
          <p className="font-heading text-primary/60 text-sm tracking-[0.15em] italic">
            &ldquo;Gather my shards. Restore the beauty. Receive my{" "}
            {brand.tokenName}.&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Buy Tokens */}
      <motion.div
        className="card-luxury rounded-lg p-5 sm:p-8 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="font-heading text-foreground/40 text-xs tracking-[0.3em] uppercase mb-2">
          Acquire
        </p>
        <h2 className="font-heading text-xl text-primary tracking-[0.1em] mb-6">
          Buy {brand.tokenName}
        </h2>

        {/* Tier Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {tiers.map((tier) => {
            const hasPromo = tier.promoTokenAmount != null;
            const displayAmount = hasPromo
              ? tier.promoTokenAmount!
              : tier.tokenAmount;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`group relative flex flex-col items-center p-4 sm:p-6 rounded-lg border transition-all duration-300 ${
                  selectedTier?.id === tier.id
                    ? "border-primary bg-primary/8 glow-gold"
                    : "border-gold bg-vanta/50 hover:border-primary/50"
                }`}
              >
                {hasPromo && (
                  <span className="absolute -top-2.5 right-3 text-[9px] font-heading tracking-[0.2em] uppercase bg-accent text-foreground/90 px-2 py-0.5 rounded">
                    Promo
                  </span>
                )}
                <span className="font-heading text-2xl text-foreground/90 mb-1">
                  ${tier.priceUsd}
                </span>
                {hasPromo ? (
                  <span className="text-xs tracking-[0.1em] flex flex-col items-center gap-0.5">
                    <span className="line-through text-accent/60 text-[10px] decoration-accent/80">
                      {tier.tokenAmount.toLocaleString()} {brand.tokenName}
                    </span>
                    <span className="text-primary font-heading text-sm">
                      {displayAmount.toLocaleString()} {brand.tokenName}
                    </span>
                  </span>
                ) : (
                  <span className="text-primary/60 text-xs tracking-[0.1em]">
                    {tier.tokenAmount.toLocaleString()} {brand.tokenName}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {tiers.length === 0 && (
          <p className="text-foreground/30 text-sm font-heading tracking-[0.1em]">
            No packages available.
          </p>
        )}

        {/* Selected Tier Confirmation */}
        {selectedTier && (
          <motion.div
            className="bg-vanta/80 rounded-lg p-6 border border-gold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-foreground/35 text-xs tracking-[0.15em] uppercase mb-1">
                  You&apos;ll receive
                </p>
                {selectedTier.promoTokenAmount != null ? (
                  <div>
                    <span className="font-heading text-lg text-accent/50 line-through decoration-accent/60 mr-2">
                      {selectedTier.tokenAmount.toLocaleString()}
                    </span>
                    <span className="font-heading text-2xl sm:text-3xl text-gold-shimmer">
                      {selectedTier.promoTokenAmount.toLocaleString()}{" "}
                      <span className="text-lg">{brand.tokenName}</span>
                    </span>
                  </div>
                ) : (
                  <span className="font-heading text-2xl sm:text-3xl text-gold-shimmer">
                    {selectedTier.tokenAmount.toLocaleString()}{" "}
                    <span className="text-lg">{brand.tokenName}</span>
                  </span>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-foreground/35 text-xs tracking-[0.15em] uppercase mb-1">
                  Price
                </p>
                <span className="font-heading text-2xl sm:text-3xl text-foreground/90">
                  ${selectedTier.priceUsd}
                </span>
              </div>
            </div>
            <p className="text-foreground/30 text-xs mb-6 leading-relaxed">
              You&apos;ll be redirected to our secure payment processor where
              you can pay with any cryptocurrency.
            </p>
            <button
              onClick={initiateDeposit}
              disabled={depositPending}
              className={`w-full py-4 text-sm tracking-[0.2em] rounded transition-all duration-300 ${
                depositPending
                  ? "bg-foreground/10 text-foreground/30 cursor-not-allowed font-heading uppercase"
                  : "btn-crimson"
              }`}
            >
              {depositPending ? "Redirecting..." : "Acquire"}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Vault */}
      <motion.div
        className="card-luxury rounded-lg p-5 sm:p-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="font-heading text-foreground/40 text-xs tracking-[0.3em] uppercase mb-2">
          Unlocked
        </p>
        <h2 className="font-heading text-xl text-primary tracking-[0.1em] mb-6">
          Your Vault
        </h2>

        {vault.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-foreground/25 text-sm font-heading tracking-[0.1em]">
              No purchased content yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vault.map((item, i) => (
              <motion.div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-vanta/60 rounded-lg p-4 border border-gold hover:border-primary/50 transition-all duration-300 group"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <div>
                  <p className="font-heading text-foreground/80 text-sm tracking-[0.05em] uppercase">
                    {item.title}
                  </p>
                  <p className="text-primary/40 text-xs mt-1">
                    {item.tokensSpent} {brand.tokenName} &bull;{" "}
                    {new Date(item.purchasedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400/60 font-heading uppercase px-5 py-2 text-xs tracking-[0.2em] rounded">
                  Owned
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
