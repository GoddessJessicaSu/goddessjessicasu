"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";
import MediaTab from "@/components/admin/MediaTab";

type Tab = "media" | "users" | "transactions" | "config";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("media");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/magic-link";
      return;
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="p-12 text-white/50">Loading...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "media", label: "Media" },
    { key: "users", label: "Users" },
    { key: "transactions", label: "Transactions" },
    { key: "config", label: "Config" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <h1 className="text-4xl font-bold text-primary mb-8">Admin Panel</h1>

      <div className="flex gap-2 mb-8 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition ${
              tab === t.key ? "bg-white/10 text-primary" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "media" && <MediaTab />}
      {tab === "users" && <UsersTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "config" && <ConfigTab />}
    </motion.div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { api.get("/admin/users").then((res) => setUsers(res.data.users)).catch((err) => alert(err.response?.data?.error || "Failed to load users")); }, []);

  return (
    <div className="space-y-2">
      {users.map((u: any) => (
        <div key={u.id} className="flex items-center justify-between bg-white/5 rounded p-3 border border-white/10">
          <div>
            <span className="font-medium">{u.email}</span>
            {u.isAdmin && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>}
          </div>
          <div className="text-right">
            <div className="text-primary font-semibold">{u.tokenBalance} {brand.tokenName}</div>
            <div className="text-white/40 text-xs">{u._count.purchases} purchases, {u._count.transactions} deposits</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionsTab() {
  const [txs, setTxs] = useState<any[]>([]);
  useEffect(() => { api.get("/admin/transactions").then((res) => setTxs(res.data.transactions)).catch((err) => alert(err.response?.data?.error || "Failed to load transactions")); }, []);

  return (
    <div className="space-y-2">
      {txs.map((tx: any) => (
        <div key={tx.id} className="bg-white/5 rounded p-3 border border-white/10">
          <div className="flex justify-between">
            <span className="font-medium">{tx.user?.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${tx.status === "CONFIRMED" ? "bg-green-900 text-green-300" : tx.status === "EXPIRED" ? "bg-red-900 text-red-300" : "bg-yellow-900 text-yellow-300"}`}>
              {tx.status}
            </span>
          </div>
          <div className="text-white/40 text-sm mt-1">
            {tx.currency} &middot; {tx.amountCrypto ?? "pending"} &rarr; {tx.amountTokens ?? "pending"} {brand.tokenName}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigTab() {
  const [cfg, setCfg] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/config").then((res) => setCfg(res.data.config)).catch((err) => alert(err.response?.data?.error || "Failed to load config"));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/admin/config", cfg);
      setCfg(res.data.config);
      alert("Config saved");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-4">
        <div>
          <label className="text-white/50 text-sm block mb-1">USD per Token</label>
          <input type="number" step="0.001" value={cfg.rateUsdPerToken || ""} onChange={(e) => setCfg({ ...cfg, rateUsdPerToken: parseFloat(e.target.value) })} className="px-3 py-2 bg-black border border-white/10 rounded text-white w-48" />
        </div>
        <div>
          <label className="text-white/50 text-sm block mb-1">BTC per Token (optional override)</label>
          <input type="number" step="0.00000001" value={cfg.rateBtcPerToken || ""} onChange={(e) => setCfg({ ...cfg, rateBtcPerToken: e.target.value ? parseFloat(e.target.value) : null })} className="px-3 py-2 bg-black border border-white/10 rounded text-white w-48" />
        </div>
        <div>
          <label className="text-white/50 text-sm block mb-1">ETH per Token (optional override)</label>
          <input type="number" step="0.00000001" value={cfg.rateEthPerToken || ""} onChange={(e) => setCfg({ ...cfg, rateEthPerToken: e.target.value ? parseFloat(e.target.value) : null })} className="px-3 py-2 bg-black border border-white/10 rounded text-white w-48" />
        </div>
        <div>
          <label className="text-white/50 text-sm block mb-1">Bio Text</label>
          <textarea value={cfg.bioText || ""} onChange={(e) => setCfg({ ...cfg, bioText: e.target.value })} className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white" rows={4} />
        </div>
        <div>
          <label className="text-white/50 text-sm block mb-1">Custom Video Instructions</label>
          <textarea value={cfg.customVideoText || ""} onChange={(e) => setCfg({ ...cfg, customVideoText: e.target.value })} className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white" rows={4} />
        </div>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-black font-semibold rounded hover:brightness-110 transition disabled:opacity-50">
          {saving ? "Saving..." : "Save Config"}
        </button>
      </div>

      <TiersSection />
    </div>
  );
}

interface Tier {
  id: string;
  priceUsd: number;
  tokenAmount: number;
  isActive: boolean;
  sortOrder: number;
}

function TiersSection() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [newPriceUsd, setNewPriceUsd] = useState("");
  const [newTokenAmount, setNewTokenAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Tier>>({});

  const loadTiers = () => {
    api.get("/admin/tiers").then((res) => setTiers(res.data.tiers)).catch(() => alert("Failed to load tiers"));
  };

  useEffect(() => { loadTiers(); }, []);

  const handleAdd = async () => {
    const priceUsd = parseFloat(newPriceUsd);
    const tokenAmount = parseFloat(newTokenAmount);
    if (!priceUsd || !tokenAmount) return;
    try {
      await api.post("/admin/tiers", { priceUsd, tokenAmount, sortOrder: tiers.length });
      setNewPriceUsd("");
      setNewTokenAmount("");
      loadTiers();
    } catch {
      alert("Failed to create tier");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/admin/tiers/${id}`, editData);
      setEditingId(null);
      setEditData({});
      loadTiers();
    } catch {
      alert("Failed to update tier");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tier?")) return;
    try {
      await api.delete(`/admin/tiers/${id}`);
      loadTiers();
    } catch {
      alert("Failed to delete tier");
    }
  };

  const handleToggleActive = async (tier: Tier) => {
    try {
      await api.put(`/admin/tiers/${tier.id}`, { isActive: !tier.isActive });
      loadTiers();
    } catch {
      alert("Failed to update tier");
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4">Token Tiers</h3>

      <div className="space-y-2 mb-6">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex items-center gap-3 bg-black/30 rounded p-3 border border-white/10">
            {editingId === tier.id ? (
              <>
                <input type="number" step="0.01" value={editData.priceUsd ?? tier.priceUsd} onChange={(e) => setEditData({ ...editData, priceUsd: parseFloat(e.target.value) })} className="px-2 py-1 bg-black border border-white/10 rounded text-white w-24" />
                <span className="text-white/30">USD →</span>
                <input type="number" value={editData.tokenAmount ?? tier.tokenAmount} onChange={(e) => setEditData({ ...editData, tokenAmount: parseFloat(e.target.value) })} className="px-2 py-1 bg-black border border-white/10 rounded text-white w-28" />
                <span className="text-white/30">{brand.tokenName}</span>
                <button onClick={() => handleUpdate(tier.id)} className="px-3 py-1 bg-primary text-black text-sm rounded font-medium">Save</button>
                <button onClick={() => { setEditingId(null); setEditData({}); }} className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded">Cancel</button>
              </>
            ) : (
              <>
                <span className="font-medium text-primary">${tier.priceUsd}</span>
                <span className="text-white/30">→</span>
                <span className="font-medium">{tier.tokenAmount.toLocaleString()} {brand.tokenName}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded cursor-pointer ${tier.isActive ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`} onClick={() => handleToggleActive(tier)}>
                  {tier.isActive ? "Active" : "Inactive"}
                </span>
                <button onClick={() => { setEditingId(tier.id); setEditData({ priceUsd: tier.priceUsd, tokenAmount: tier.tokenAmount }); }} className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded hover:bg-white/20">Edit</button>
                <button onClick={() => handleDelete(tier.id)} className="px-3 py-1 bg-red-900/50 text-red-300 text-sm rounded hover:bg-red-900">Delete</button>
              </>
            )}
          </div>
        ))}
        {tiers.length === 0 && <p className="text-white/40 text-sm">No tiers yet.</p>}
      </div>

      <div className="flex items-center gap-3">
        <input type="number" step="0.01" placeholder="Price (USD)" value={newPriceUsd} onChange={(e) => setNewPriceUsd(e.target.value)} className="px-3 py-2 bg-black border border-white/10 rounded text-white w-32" />
        <input type="number" placeholder="Tokens" value={newTokenAmount} onChange={(e) => setNewTokenAmount(e.target.value)} className="px-3 py-2 bg-black border border-white/10 rounded text-white w-32" />
        <button onClick={handleAdd} className="px-4 py-2 bg-primary text-black font-semibold rounded hover:brightness-110 transition">Add Tier</button>
      </div>
    </div>
  );
}
