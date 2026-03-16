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

interface DepositAddresses {
  BTC: string;
  ETH: string;
  USDT_TRC20: string;
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
  cryptoAmounts: {
    BTC: number | null;
    ETH: number | null;
    USDT_TRC20: number;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierInfo | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [depositPending, setDepositPending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/magic-link";
      return;
    }

    Promise.all([
      api.get("/auth/me"),
      api.get("/deposit/addresses"),
      api.get("/purchase/vault"),
      api.get("/deposit/tiers"),
    ])
      .then(([userRes, addrRes, vaultRes, tiersRes]) => {
        setUser(userRes.data.user);
        setAddresses(addrRes.data);
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
        currency: selectedCrypto,
        tierId: selectedTier.id,
      });
      const cryptoAmount = selectedTier.cryptoAmounts[selectedCrypto as keyof TierInfo["cryptoAmounts"]];
      setDepositStatus(
        `Deposit initiated! Send exactly ${cryptoAmount} ${selectedCrypto} to the address above. You'll receive ${selectedTier.tokenAmount.toLocaleString()} ${brand.tokenName} once confirmed.`
      );
    } catch (err: any) {
      setDepositStatus(err.response?.data?.error || "Failed to initiate deposit");
      setDepositPending(false);
    }
  };

  if (loading) return <div className="p-12 text-white/50">Loading...</div>;
  if (error) return <div className="p-12 text-red-400">{error}</div>;
  if (!user) return null;

  const cryptoOptions = [
    { key: "BTC", label: "Bitcoin (BTC)" },
    { key: "ETH", label: "Ethereum (ETH)" },
    // { key: "USDT_TRC20", label: "USDT (TRC-20)" }, // TODO: re-enable when TRON is ready
  ];

  const selectedCryptoAmount = selectedTier
    ? selectedTier.cryptoAmounts[selectedCrypto as keyof TierInfo["cryptoAmounts"]]
    : null;

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

        {/* Step 1: Select a Package */}
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

        {/* Step 2: Select Crypto */}
        {selectedTier && (
          <div className="mb-6">
            <div className="text-white/50 text-sm mb-2">Pay With</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {cryptoOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedCrypto(opt.key)}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    selectedCrypto === opt.key
                      ? "bg-primary text-black"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Amount + Address */}
            {selectedCryptoAmount != null && (
              <div className="bg-black/50 rounded-lg p-4 border border-white/10 space-y-3">
                <div>
                  <div className="text-white/50 text-sm">Send exactly:</div>
                  <div className="text-2xl font-bold text-primary font-mono">
                    {selectedCryptoAmount} {selectedCrypto === "USDT_TRC20" ? "USDT" : selectedCrypto}
                  </div>
                </div>
                {addresses && (
                  <div>
                    <div className="text-white/50 text-sm">To:</div>
                    <div className="bg-black border border-white/10 rounded p-3 font-mono text-sm break-all select-all">
                      {addresses[selectedCrypto as keyof DepositAddresses]}
                    </div>
                  </div>
                )}
                <button
                  onClick={initiateDeposit}
                  disabled={depositPending}
                  className={`w-full px-6 py-3 font-semibold rounded transition ${
                    depositPending
                      ? "bg-white/20 text-white/40 cursor-not-allowed"
                      : "bg-primary text-black hover:brightness-110"
                  }`}
                >
                  {depositPending ? "Awaiting Confirmation..." : "I\u2019ve Sent the Payment"}
                </button>
              </div>
            )}
            {selectedCryptoAmount == null && (
              <div className="text-white/40 text-sm">Price unavailable for {selectedCrypto} right now.</div>
            )}
          </div>
        )}

        {depositStatus && (
          <div className="mt-3 p-3 bg-green-900/20 border border-green-800 rounded text-sm text-green-300">{depositStatus}</div>
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
