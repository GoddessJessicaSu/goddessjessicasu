"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";
import MediaTab from "@/components/admin/MediaTab";
import AttributesTab from "@/components/admin/AttributesTab";

type Tab = "media" | "attributes" | "users" | "sales" | "transactions" | "config";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("media");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/magic-link";
      return;
    }
    api.get("/auth/me")
      .then((res) => {
        if (!res.data.user.isAdmin) {
          window.location.href = "/dashboard";
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        window.location.href = "/auth/magic-link";
      });
  }, []);

  if (loading) return <div className="p-12 text-white/50">Loading...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "media", label: "Media" },
    { key: "attributes", label: "Attributes" },
    { key: "users", label: "Users" },
    { key: "sales", label: "Sales" },
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
      {tab === "attributes" && <AttributesTab />}
      {tab === "users" && <UsersTab />}
      {tab === "sales" && <SalesTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "config" && <ConfigTab />}
    </motion.div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const loadUsers = () => {
    api.get("/admin/users").then((res) => setUsers(res.data.users)).catch((err) => alert(err.response?.data?.error || "Failed to load users"));
  };

  useEffect(() => { loadUsers(); }, []);

  const saveBalance = async (id: number) => {
    const val = parseFloat(editBalance);
    if (isNaN(val) || val < 0) return;
    try {
      await api.put(`/admin/users/${id}`, { tokenBalance: val });
      setEditingId(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update balance");
    }
  };

  return (
    <div className="space-y-2">
      {users.map((u: any) => (
        <div key={u.id} className="flex items-center justify-between bg-white/5 rounded p-3 border border-white/10">
          <div>
            <span className="font-medium">{u.username || u.email}</span>
            {u.username && <span className="ml-2 text-xs text-white/30">{u.email}</span>}
            {u.isAdmin && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>}
          </div>
          <div className="flex items-center gap-3">
            {editingId === u.id ? (
              <span className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveBalance(u.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="px-2 py-0.5 bg-black border border-white/20 rounded text-white w-24 text-sm"
                  autoFocus
                />
                <span className="text-white/40 text-xs">{brand.tokenName}</span>
                <button onClick={() => saveBalance(u.id)} className="px-2 py-0.5 bg-primary text-black text-xs rounded font-medium">Save</button>
                <button onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded">Cancel</button>
              </span>
            ) : (
              <div className="text-right">
                <div
                  className="text-primary font-semibold cursor-pointer hover:text-primary/70 transition-colors"
                  onClick={() => { setEditingId(u.id); setEditBalance(String(u.tokenBalance)); }}
                  title="Click to edit balance"
                >
                  {u.tokenBalance} {brand.tokenName}
                </div>
                <div className="text-white/40 text-xs">{u._count.purchases} purchases, {u._count.transactions} deposits</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesTab() {
  const [sales, setSales] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/admin/sales").then((res) => setSales(res.data.sales)).catch((err) => alert(err.response?.data?.error || "Failed to load sales"));
  }, []);

  const totalSales = sales.reduce((sum, m) => sum + m.totalSales, 0);
  const totalTokens = sales.reduce((sum, m) => sum + m.totalTokensEarned, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-2">
        <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
          <div className="text-white/40 text-xs uppercase tracking-wider">Total Sales</div>
          <div className="text-2xl font-bold text-primary">{totalSales}</div>
        </div>
        <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
          <div className="text-white/40 text-xs uppercase tracking-wider">Total {brand.tokenName} Earned</div>
          <div className="text-2xl font-bold text-primary">{totalTokens.toLocaleString()}</div>
        </div>
      </div>

      {sales.map((m: any) => (
        <div key={m.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition"
            onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
          >
            <div>
              <span className="font-medium">{m.title}</span>
              <span className="ml-3 text-white/30 text-sm">{m.priceTokens} {brand.tokenName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                <span className="text-primary font-semibold">{m.totalSales}</span>
                <span className="text-white/40 ml-1">{m.totalSales === 1 ? "sale" : "sales"}</span>
              </span>
              <span className="text-sm">
                <span className="text-primary font-semibold">{m.totalTokensEarned.toLocaleString()}</span>
                <span className="text-white/40 ml-1">{brand.tokenName}</span>
              </span>
              <span className="text-white/30 text-sm">{expandedId === m.id ? "\u25B2" : "\u25BC"}</span>
            </div>
          </div>

          {expandedId === m.id && (
            <div className="border-t border-white/10">
              {m.buyers.length === 0 ? (
                <div className="p-4 text-white/30 text-sm">No purchases yet.</div>
              ) : (
                m.buyers.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-b-0">
                    <span className="text-sm">
                      <span className="font-medium">{b.user.username || b.user.email}</span>
                      {b.user.username && <span className="ml-2 text-white/30 text-xs">{b.user.email}</span>}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-primary text-sm font-medium">{b.tokensSpent} {brand.tokenName}</span>
                      <span className="text-white/30 text-xs">{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}

      {sales.length === 0 && <p className="text-white/40 text-sm">No masterpieces yet.</p>}
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
            <span className="font-medium">{tx.user?.username || tx.user?.email}</span>
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
          <label className="text-white/50 text-sm block mb-1">Annual Body Count</label>
          <input type="number" step="1" value={cfg.bodyCount ?? 0} onChange={(e) => setCfg({ ...cfg, bodyCount: parseInt(e.target.value) || 0 })} className="px-3 py-2 bg-black border border-white/10 rounded text-white w-48" />
          <p className="text-white/25 text-xs mt-1">Displayed on the landing page hero section.</p>
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

      <WhitelistSection config={cfg} onConfigUpdate={setCfg} />
      <TiersSection />
    </div>
  );
}

function WhitelistSection({ config, onConfigUpdate }: { config: any; onConfigUpdate: (c: any) => void }) {
  const [emails, setEmails] = useState<{ id: string; email: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [toggling, setToggling] = useState(false);

  const loadEmails = () => {
    api.get("/admin/whitelist").then((res) => setEmails(res.data.emails)).catch(() => {});
  };

  useEffect(() => { loadEmails(); }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await api.put("/admin/config", { whitelistEnabled: !config.whitelistEnabled });
      onConfigUpdate(res.data.config);
    } catch {
      alert("Failed to update");
    } finally {
      setToggling(false);
    }
  };

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    try {
      await api.post("/admin/whitelist", { email });
      setNewEmail("");
      loadEmails();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add email");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`/admin/whitelist/${id}`);
      loadEmails();
    } catch {
      alert("Failed to remove email");
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Whitelist</h3>
          <p className="text-white/25 text-xs mt-1">When enabled, only whitelisted emails can sign in and operate.</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
            config.whitelistEnabled ? "bg-green-600" : "bg-white/10"
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
            config.whitelistEnabled ? "translate-x-6" : "translate-x-0"
          }`} />
        </button>
      </div>

      {config.whitelistEnabled && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="user@example.com"
              className="flex-1 px-3 py-2 bg-black border border-white/10 rounded text-white text-sm placeholder:text-white/20"
            />
            <button onClick={handleAdd} className="px-4 py-2 bg-primary text-black font-semibold rounded text-sm hover:brightness-110 transition">
              Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            {emails.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-black/30 rounded px-3 py-2 border border-white/10">
                <span className="text-white/70 text-sm font-mono">{entry.email}</span>
                <button onClick={() => handleRemove(entry.id)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">
                  Remove
                </button>
              </div>
            ))}
            {emails.length === 0 && <p className="text-white/30 text-sm text-center py-2">No emails whitelisted yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

interface Tier {
  id: string;
  priceUsd: number;
  tokenAmount: number;
  promoTokenAmount: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface TierEditData {
  priceUsd?: number;
  tokenAmount?: number;
  promoTokenAmount?: number | null;
}

function TiersSection() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [newPriceUsd, setNewPriceUsd] = useState("");
  const [newTokenAmount, setNewTokenAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<TierEditData>({});
  const [promoInput, setPromoInput] = useState("");

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
    const promoVal = promoInput.trim() ? parseFloat(promoInput) : null;
    try {
      await api.put(`/admin/tiers/${id}`, { ...editData, promoTokenAmount: promoVal });
      setEditingId(null);
      setEditData({});
      setPromoInput("");
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

  const startEdit = (tier: Tier) => {
    setEditingId(tier.id);
    setEditData({ priceUsd: tier.priceUsd, tokenAmount: tier.tokenAmount });
    setPromoInput(tier.promoTokenAmount ? String(tier.promoTokenAmount) : "");
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4">Token Tiers</h3>

      <div className="space-y-2 mb-6">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-black/30 rounded p-3 border border-white/10">
            {editingId === tier.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Price (USD)</label>
                    <input type="number" step="0.01" value={editData.priceUsd ?? tier.priceUsd} onChange={(e) => setEditData({ ...editData, priceUsd: parseFloat(e.target.value) })} className="px-2 py-1 bg-black border border-white/10 rounded text-white w-24" />
                  </div>
                  <div>
                    <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Base {brand.tokenName}</label>
                    <input type="number" value={editData.tokenAmount ?? tier.tokenAmount} onChange={(e) => setEditData({ ...editData, tokenAmount: parseFloat(e.target.value) })} className="px-2 py-1 bg-black border border-white/10 rounded text-white w-28" />
                  </div>
                  <div>
                    <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Promo {brand.tokenName} <span className="text-white/15">(optional)</span></label>
                    <input type="number" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="—" className="px-2 py-1 bg-black border border-white/10 rounded text-white w-28 placeholder:text-white/15" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(tier.id)} className="px-3 py-1 bg-primary text-black text-sm rounded font-medium">Save</button>
                  <button onClick={() => { setEditingId(null); setEditData({}); setPromoInput(""); }} className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-medium text-primary">${tier.priceUsd}</span>
                <span className="text-white/30">&rarr;</span>
                {tier.promoTokenAmount ? (
                  <span className="font-medium">
                    <span className="line-through text-red-400/60 text-sm">{tier.tokenAmount.toLocaleString()}</span>
                    <span className="ml-1.5 text-primary">{tier.promoTokenAmount.toLocaleString()}</span>
                    <span className="text-white/50 ml-1">{brand.tokenName}</span>
                    <span className="ml-2 text-[10px] bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded uppercase tracking-wider">Promo</span>
                  </span>
                ) : (
                  <span className="font-medium">{tier.tokenAmount.toLocaleString()} {brand.tokenName}</span>
                )}
                <span className={`ml-auto text-xs px-2 py-0.5 rounded cursor-pointer ${tier.isActive ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`} onClick={() => handleToggleActive(tier)}>
                  {tier.isActive ? "Active" : "Inactive"}
                </span>
                <button onClick={() => startEdit(tier)} className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded hover:bg-white/20">Edit</button>
                <button onClick={() => handleDelete(tier.id)} className="px-3 py-1 bg-red-900/50 text-red-300 text-sm rounded hover:bg-red-900">Delete</button>
              </div>
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
