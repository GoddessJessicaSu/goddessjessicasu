"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  priceTokens: number;
  mimeType: string;
  durationSecs: number | null;
  thumbnailUrls: string[];
  previewUrl: string | null;
  purchased: boolean;
}

export default function Gallery() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/gallery")
      .then((res) => setMedia(res.data.media))
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load gallery");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <h1 className="text-4xl font-bold text-primary mb-8">Gallery</h1>

      {loading ? (
        <div className="text-white/50">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : media.length === 0 ? (
        <div className="text-white/50">No content available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current && item.previewUrl) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handlePurchase = async () => {
    try {
      const res = await api.post(`/purchase/${item.id}`);
      if (res.data.streamUrl) {
        window.open(res.data.streamUrl, "_blank");
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Purchase failed");
    }
  };

  return (
    <motion.div
      className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-colors"
      whileHover={{ y: -4 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-video bg-black relative">
        {item.previewUrl ? (
          <video
            ref={videoRef}
            src={item.previewUrl}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={item.thumbnailUrls[0] || undefined}
          />
        ) : item.thumbnailUrls.length > 0 ? (
          <img src={item.thumbnailUrls[0]} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">No Preview</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{item.title}</h3>
        {item.description && <p className="text-white/50 text-sm mb-3">{item.description}</p>}
        <div className="flex items-center justify-between">
          <span className="text-primary font-bold">{item.priceTokens} {brand.tokenName}</span>
          <button
            onClick={handlePurchase}
            className="px-4 py-1.5 bg-primary text-black text-sm font-semibold rounded hover:brightness-110 transition"
          >
            {item.purchased ? "Watch" : "Unlock"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
