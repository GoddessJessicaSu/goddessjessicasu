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
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-8 py-16"
    >
      {/* Header */}
      <div className="mb-16">
        <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-4">The Collection</p>
        <h1 className="font-heading text-4xl md:text-5xl text-gold-shimmer">Gallery</h1>
        <div className="w-16 h-px bg-primary/30 mt-6" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="font-heading text-primary/30 text-sm tracking-[0.3em] uppercase">Loading...</div>
        </div>
      ) : error ? (
        <div className="text-accent text-center py-32">{error}</div>
      ) : media.length === 0 ? (
        <div className="text-center py-32">
          <p className="font-heading text-foreground/30 text-sm tracking-[0.2em] uppercase">No content available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {media.map((item, i) => (
            <MediaCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MediaCard({ item, index }: { item: MediaItem; index: number }) {
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
      className="group card-luxury rounded-lg overflow-hidden transition-all duration-500 hover:glow-crimson"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -6 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image/Video area */}
      <div className="aspect-video bg-vanta relative overflow-hidden">
        {item.previewUrl ? (
          <video
            ref={videoRef}
            src={item.previewUrl}
            muted
            loop
            playsInline
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
            poster={item.thumbnailUrls[0] || undefined}
          />
        ) : item.thumbnailUrls.length > 0 ? (
          <img
            src={item.thumbnailUrls[0]}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-heading text-foreground/10 text-xs tracking-[0.3em] uppercase">No Preview</span>
          </div>
        )}

        {/* Price badge overlay */}
        <div className="absolute top-3 right-3 bg-vanta/80 backdrop-blur-sm border border-gold px-3 py-1">
          <span className="font-heading text-primary text-xs tracking-[0.1em]">
            {item.priceTokens} {brand.tokenName}
          </span>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-matte to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-heading text-foreground/90 text-sm tracking-[0.1em] uppercase mb-1">{item.title}</h3>
        {item.description && (
          <p className="text-foreground/35 text-xs leading-relaxed mb-4 line-clamp-2">{item.description}</p>
        )}
        <button
          onClick={handlePurchase}
          className={`w-full py-2.5 text-xs tracking-[0.15em] rounded transition-all duration-300 ${
            item.purchased
              ? "btn-crimson"
              : "btn-crimson"
          }`}
        >
          {item.purchased ? "Watch" : "Unlock Content"}
        </button>
      </div>
    </motion.div>
  );
}
