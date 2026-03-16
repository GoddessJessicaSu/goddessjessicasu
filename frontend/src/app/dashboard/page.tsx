"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";

interface UserInfo {
  id: number;
  email: string;
  tokenBalance: number;
}

interface VaultItem {
  id: string;
  title: string;
  streamUrl: string;
  tokensSpent: number;
  purchasedAt: string;
}

interface TierInfo {
  id: string;
  priceUsd: number;
  tokenAmount: number;
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
      // Redirect to NOWPayments hosted invoice page
      window.location.href = res.data.invoiceUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate payment");
      setDepositPending(false);
    }
  };

  if (loading) return <div className="p-12 text-white/50">Loading...</div>;
  if (error) return <div className="p-12 text-red-400">{error}</div>;
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <h1 className="text-4xl font-bold text-primary mb-2">Dashboard</h1>
      <p className="text-white/50 mb-8">{user.email}</p>

      {/* Balance */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-8">
        <div className="text-white/50 text-sm mb-1">Your Balance</div>
        <div className="text-4xl font-bold text-primary">
          {user.tokenBalance.toLocaleString()} <span className="text-lg">{brand.tokenName}</span>
        </div>
      </div>

      {/* Deposit — Tier Selection */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-8">
        <h2 className="text-xl font-semibold mb-4">Buy {brand.tokenName}</h2>

        {/* Select a Package */}
        <div className="mb-6">
          <div className="text-white/50 text-sm mb-2">Select a Package</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`flex flex-col items-center p-4 rounded-lg border transition ${
                  selectedTier?.id === tier.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-black/30 text-white/70 hover:border-white/30"
                }`}
              >
                <span className="text-lg font-bold">${tier.priceUsd}</span>
                <span className="text-sm mt-1">{tier.tokenAmount.toLocaleString()} {brand.tokenName}</span>
              </button>
            ))}
          </div>
          {tiers.length === 0 && <p className="text-white/40 text-sm">No packages available.</p>}
        </div>

        {/* Buy Button */}
        {selectedTier && (
          <div className="bg-black/50 rounded-lg p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/50 text-sm">You&apos;ll receive:</div>
                <div className="text-2xl font-bold text-primary">
                  {selectedTier.tokenAmount.toLocaleString()} {brand.tokenName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/50 text-sm">Price:</div>
                <div className="text-2xl font-bold">${selectedTier.priceUsd}</div>
              </div>
            </div>
            <p className="text-white/40 text-sm">
              You&apos;ll be redirected to our secure payment processor where you can pay with any cryptocurrency.
            </p>
            <button
              onClick={initiateDeposit}
              disabled={depositPending}
              className={`w-full px-6 py-3 font-semibold rounded transition ${
                depositPending
                  ? "bg-white/20 text-white/40 cursor-not-allowed"
                  : "bg-primary text-black hover:brightness-110"
              }`}
            >
              {depositPending ? "Redirecting..." : "Pay with Crypto"}
            </button>
          </div>
        )}
      </div>

      {/* Vault */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Your Vault</h2>
        {vault.length === 0 ? (
          <p className="text-white/50">No purchased content yet.</p>
        ) : (
          <div className="space-y-3">
            {vault.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-black/50 rounded p-3 border border-white/5">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-white/40 text-sm">{item.tokensSpent} {brand.tokenName}</div>
                </div>
                <a
                  href={item.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-primary text-black text-sm font-semibold rounded hover:brightness-110 transition"
                >
                  Watch
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
