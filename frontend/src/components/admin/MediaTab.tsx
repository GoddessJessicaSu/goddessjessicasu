"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";
import AddMediaForm from "./AddMediaForm";

export default function MediaTab() {
  const [media, setMedia] = useState<any[]>([]);

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

  return (
    <div>
      <AddMediaForm onCreated={loadMedia} />

      <div className="space-y-2">
        {media.map((m: any) => (
          <div
            key={m.id}
            className="flex items-center justify-between bg-white/5 rounded p-3 border border-white/10"
          >
            <div>
              <span className="font-medium">{m.title}</span>
              <span className="text-white/40 text-sm ml-2">
                {m.priceTokens} {brand.tokenName}
              </span>
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded ${
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
                onClick={() => togglePublish(m.id, m.isPublished)}
                className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/10"
              >
                {m.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => deleteMedia(m.id)}
                className="px-3 py-1 text-sm border border-red-900 text-red-400 rounded hover:bg-red-900/30"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
