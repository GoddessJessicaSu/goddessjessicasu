"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";
import AddMediaForm from "./AddMediaForm";

interface EditState {
  title: string;
  description: string;
  priceTokens: string;
}

export default function MediaTab() {
  const [media, setMedia] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({ title: "", description: "", priceTokens: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = () => {
    api
      .get("/admin/media")
      .then((res) => setMedia(res.data.media))
      .catch((err) =>
        alert(err.response?.data?.error || "Failed to load media")
      );
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/media/${id}`, { isPublished: !current });
      loadMedia();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update media");
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete this media?")) return;
    try {
      await api.delete(`/admin/media/${id}`);
      loadMedia();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete media");
    }
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setEdit({
      title: m.title,
      description: m.description || "",
      priceTokens: String(m.priceTokens),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit({ title: "", description: "", priceTokens: "" });
  };

  const saveEdit = async (id: string) => {
    const price = parseFloat(edit.priceTokens);
    if (!edit.title.trim()) return alert("Title is required");
    if (isNaN(price) || price < 0) return alert("Invalid price");

    setSaving(true);
    try {
      await api.put(`/admin/media/${id}`, {
        title: edit.title.trim(),
        description: edit.description.trim() || null,
        priceTokens: price,
      });
      cancelEdit();
      loadMedia();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update media");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AddMediaForm onCreated={loadMedia} />

      <div className="space-y-2">
        {media.map((m: any) =>
          editingId === m.id ? (
            <div
              key={m.id}
              className="bg-white/5 rounded-lg p-4 border border-primary/30 space-y-3"
            >
              {/* Title */}
              <div>
                <label className="text-white/40 text-xs block mb-1">Title</label>
                <input
                  type="text"
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-white/40 text-xs block mb-1">Description</label>
                <textarea
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white text-sm resize-y focus:border-primary/50 focus:outline-none transition-colors"
                  placeholder="Optional description..."
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-white/40 text-xs block mb-1">Price ({brand.tokenName})</label>
                <input
                  type="number"
                  step="0.1"
                  value={edit.priceTokens}
                  onChange={(e) => setEdit({ ...edit, priceTokens: e.target.value })}
                  className="px-3 py-2 bg-black border border-white/15 rounded text-white text-sm w-32 focus:border-primary/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => saveEdit(m.id)}
                  disabled={saving}
                  className="px-4 py-1.5 bg-primary text-black text-sm rounded font-medium hover:brightness-110 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-1.5 bg-white/10 text-white/70 text-sm rounded hover:bg-white/15 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className="bg-white/5 rounded p-3 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.title}</span>
                  <span className="text-white/40 text-sm">
                    {m.priceTokens} {brand.tokenName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      m.isPublished
                        ? "bg-green-900 text-green-300"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {m.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(m)}
                    className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/10 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublish(m.id, m.isPublished)}
                    className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/10 transition"
                  >
                    {m.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => deleteMedia(m.id)}
                    className="px-3 py-1 text-sm border border-red-900 text-red-400 rounded hover:bg-red-900/30 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {m.description && (
                <p className="text-white/30 text-xs mt-1.5 line-clamp-2">{m.description}</p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
