"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
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
  const [lightbox, setLightbox] = useState<{
    urls: string[];
    index: number;
    title: string;
  } | null>(null);
  const [descModal, setDescModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [successModal, setSuccessModal] = useState<{ title: string } | null>(
    null,
  );
  const [insufficientModal, setInsufficientModal] = useState<{
    title: string;
    required: number;
    current: number;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/magic-link";
      return;
    }
    loadGallery();
  }, []);

  const loadGallery = () => {
    api
      .get("/gallery")
      .then((res) => setMedia(res.data.media))
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          window.location.href = "/auth/magic-link";
          return;
        }
        setError(err.response?.data?.error || "Failed to load gallery");
      })
      .finally(() => setLoading(false));
  };

  const openLightbox = (urls: string[], index: number, title: string) => {
    setLightbox({ urls, index, title });
  };

  const handlePurchaseSuccess = (title: string) => {
    setSuccessModal({ title });
    loadGallery();
  };

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
        <p className="font-heading text-primary/50 text-xs tracking-[0.4em] uppercase mb-4">
          The Collection
        </p>
        <h1 className="font-heading text-4xl md:text-5xl text-gold-shimmer">
          Masterpieces
        </h1>
        <div className="w-16 h-px bg-primary/30 mt-6" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="font-heading text-primary/30 text-sm tracking-[0.3em] uppercase">
            Loading...
          </div>
        </div>
      ) : error ? (
        <div className="text-accent text-center py-32">{error}</div>
      ) : media.length === 0 ? (
        <div className="text-center py-32">
          <p className="font-heading text-foreground/30 text-sm tracking-[0.2em] uppercase">
            No content available yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {media.map((item, i) => (
            <MediaCard
              key={item.id}
              item={item}
              index={i}
              onImageClick={openLightbox}
              onReadMore={(title, desc) =>
                setDescModal({ title, description: desc })
              }
              onPurchaseSuccess={handlePurchaseSuccess}
              onInsufficientBalance={(title, required, current) =>
                setInsufficientModal({ title, required, current })
              }
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            urls={lightbox.urls}
            initialIndex={lightbox.index}
            title={lightbox.title}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      {/* Description Modal */}
      <AnimatePresence>
        {descModal && (
          <DescriptionModal
            title={descModal.title}
            description={descModal.description}
            onClose={() => setDescModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Download Sent Modal */}
      <AnimatePresence>
        {successModal && (
          <DownloadSentModal
            title={successModal.title}
            onClose={() => setSuccessModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Insufficient Balance Modal */}
      <AnimatePresence>
        {insufficientModal && (
          <InsufficientBalanceModal
            title={insufficientModal.title}
            required={insufficientModal.required}
            current={insufficientModal.current}
            onClose={() => setInsufficientModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MediaCard({
  item,
  index,
  onImageClick,
  onReadMore,
  onPurchaseSuccess,
  onInsufficientBalance,
}: {
  item: MediaItem;
  index: number;
  onImageClick: (urls: string[], index: number, title: string) => void;
  onReadMore: (title: string, description: string) => void;
  onPurchaseSuccess: (title: string) => void;
  onInsufficientBalance: (title: string, required: number, current: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [busy, setBusy] = useState(false);
  const hasMultiple = item.thumbnailUrls.length > 1;

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [item.description]);

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
    setBusy(true);
    try {
      await api.post(`/purchase/${item.id}`);
      onPurchaseSuccess(item.title);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.error === "Insufficient balance") {
        onInsufficientBalance(item.title, data.required, data.current);
      } else {
        alert(data?.error || "Purchase failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="group card-luxury rounded-lg overflow-hidden transition-all duration-500 hover:glow-crimson flex flex-col"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -6 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main image/video */}
      <div
        className="aspect-[9/16] bg-vanta relative overflow-hidden cursor-pointer"
        onClick={() => {
          if (item.thumbnailUrls.length > 0) {
            onImageClick(item.thumbnailUrls, 0, item.title);
          }
        }}
      >
        {item.previewUrl ? (
          <video
            ref={videoRef}
            src={item.previewUrl}
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
            poster={item.thumbnailUrls[0] || undefined}
          />
        ) : item.thumbnailUrls.length > 0 ? (
          <img
            src={item.thumbnailUrls[0]}
            alt={item.title}
            className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-heading text-foreground/10 text-xs tracking-[0.3em] uppercase">
              No Preview
            </span>
          </div>
        )}

        {/* Price / Owned badge */}
        <div
          className={`absolute top-3 right-3 backdrop-blur-sm px-3 h-7 flex items-center justify-center min-w-[7rem] ${
            item.purchased
              ? "bg-emerald-950/80 border border-emerald-500/40"
              : "bg-vanta/80 border border-gold"
          }`}
        >
          <span
            className={`font-heading text-xs tracking-[0.1em] ${
              item.purchased ? "text-emerald-400" : "text-primary"
            }`}
          >
            {item.purchased
              ? "Owned"
              : `${item.priceTokens} ${brand.tokenName}`}
          </span>
        </div>

        {/* Image count badge */}
        {hasMultiple && (
          <div className="absolute top-3 left-3 bg-vanta/80 backdrop-blur-sm border border-gold/50 px-3 h-7 flex items-center gap-1.5">
            <svg
              className="w-3 h-3 text-primary/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
            <span className="font-heading text-foreground/50 text-xs tracking-[0.1em]">
              {item.thumbnailUrls.length}
            </span>
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-matte to-transparent" />
      </div>

      {/* Thumbnail strip — show on hover or when expanded */}
      {hasMultiple && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 bg-vanta/80 border-b border-gold/30 hover:bg-vanta transition-colors duration-300"
          >
            <span className="text-foreground/30 text-[10px] tracking-[0.2em] uppercase font-heading">
              {expanded
                ? "Hide previews"
                : `View all ${item.thumbnailUrls.length} photos`}
            </span>
            <motion.svg
              className="w-3 h-3 text-primary/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="p-3 grid grid-cols-4 gap-1.5 bg-vanta/60">
                  {item.thumbnailUrls.map((url, i) => (
                    <motion.div
                      key={i}
                      className="aspect-square overflow-hidden rounded cursor-pointer relative group/thumb"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(item.thumbnailUrls, i, item.title);
                      }}
                    >
                      <img
                        src={url}
                        alt={`${item.title} preview ${i + 1}`}
                        className="w-full h-full object-cover transition-all duration-300 group-hover/thumb:scale-110 group-hover/thumb:brightness-125"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-foreground/90 text-sm tracking-[0.1em] uppercase mb-1">
          {item.title}
        </h3>
        {item.description && (
          <div className="mb-4">
            <p
              ref={descRef}
              className="text-foreground/35 text-xs leading-relaxed line-clamp-2"
            >
              {item.description}
            </p>
            {isClamped && (
              <button
                onClick={() => onReadMore(item.title, item.description!)}
                className="text-primary/50 hover:text-primary/80 text-[10px] tracking-[0.15em] uppercase mt-1.5 transition-colors duration-300"
              >
                Read more
              </button>
            )}
          </div>
        )}
        {item.purchased ? (
          <div className="w-full py-2.5 text-xs tracking-[0.2em] rounded text-center mt-auto bg-emerald-950/40 border border-emerald-500/20 text-emerald-400/60 font-heading uppercase cursor-default">
            Owned
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={busy}
            className="w-full py-2.5 text-xs tracking-[0.15em] rounded transition-all duration-300 mt-auto disabled:opacity-50 btn-crimson"
          >
            {busy ? "Sending..." : "Unlock Content"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Lightbox ─────────────────────────────────────────────────────── */

function Lightbox({
  urls,
  initialIndex,
  title,
  onClose,
}: {
  urls: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  const go = useCallback(
    (dir: number) => {
      setDirection(dir);
      setIndex((prev) => {
        const next = prev + dir;
        if (next < 0) return urls.length - 1;
        if (next >= urls.length) return 0;
        return next;
      });
    },
    [urls.length],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, go]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-gold/30 bg-vanta/60 text-foreground/50 hover:text-foreground hover:border-primary/50 transition-all duration-300"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Title + counter */}
      <div className="absolute top-6 left-6 z-10">
        <p className="font-heading text-foreground/60 text-sm tracking-[0.1em] uppercase">
          {title}
        </p>
        <p className="text-foreground/30 text-xs mt-1">
          {index + 1} / {urls.length}
        </p>
      </div>

      {/* Main image */}
      <div className="relative z-10 w-full max-w-4xl mx-8 aspect-[4/3] flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={index}
            src={urls[index]}
            alt={`${title} ${index + 1}`}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {/* Nav arrows */}
      {urls.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-4 md:left-8 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-gold/20 bg-vanta/40 text-foreground/40 hover:text-primary hover:border-primary/40 hover:bg-vanta/70 transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-4 md:right-8 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-gold/20 bg-vanta/40 text-foreground/40 hover:text-primary hover:border-primary/40 hover:bg-vanta/70 transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Thumbnail strip at bottom */}
      {urls.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 rounded-lg bg-vanta/60 backdrop-blur-sm border border-gold/20">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={`w-12 h-12 rounded overflow-hidden transition-all duration-300 ${
                i === index
                  ? "ring-2 ring-primary brightness-100 scale-110"
                  : "brightness-50 hover:brightness-75"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Description Modal ────────────────────────────────────────────── */

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground/80 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function DownloadSentModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-6 text-center"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="card-luxury rounded-lg p-10">
          {/* Envelope icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-primary/40 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <p className="font-heading text-primary/50 text-[10px] tracking-[0.4em] uppercase mb-4">
            Content Unlocked
          </p>
          <h2 className="font-heading text-2xl text-gold-shimmer mb-4">
            Check Your Email
          </h2>
          <div className="w-10 h-px bg-primary/20 mx-auto mb-5" />

          <p className="text-foreground/40 text-sm leading-relaxed mb-3">
            Your download link for
          </p>
          <p className="text-foreground/70 font-heading text-sm tracking-[0.1em] uppercase mb-5">
            {title}
          </p>
          <p className="text-foreground/40 text-sm leading-relaxed mb-8">
            has been sent to your email. The link is valid for{" "}
            <span className="text-foreground/70 font-medium">24 hours</span>.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 text-sm tracking-[0.2em] rounded transition-all duration-300 btn-ghost-gold"
          >
            Continue Browsing
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DescriptionModal({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const paragraphs = description.split(/\n\s*\n/).filter(Boolean);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-lg mx-6 max-h-[80vh] flex flex-col bg-vanta border border-gold/40 rounded-lg overflow-hidden shadow-2xl"
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gold/15">
          <div>
            <p className="font-heading text-primary/40 text-[10px] tracking-[0.4em] uppercase mb-2">
              About
            </p>
            <h3 className="font-heading text-foreground/90 text-lg tracking-[0.08em] uppercase">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-full border border-gold/20 text-foreground/30 hover:text-foreground/70 hover:border-primary/40 transition-all duration-300"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-4">
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className="text-foreground/60 text-sm leading-[1.8] whitespace-pre-line"
              >
                {renderBoldText(para)}
              </p>
            ))}
          </div>
        </div>

        {/* Footer fade */}
        <div className="h-8 bg-gradient-to-t from-vanta to-transparent -mt-8 relative z-10 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}

/* ─── Insufficient Balance Modal ──────────────────────────────────── */

function InsufficientBalanceModal({
  title,
  required,
  current,
  onClose,
}: {
  title: string;
  required: number;
  current: number;
  onClose: () => void;
}) {
  const needed = required - current;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-6 text-center"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="card-luxury rounded-lg p-10">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-accent/40 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          <p className="font-heading text-accent/50 text-[10px] tracking-[0.4em] uppercase mb-4">
            Insufficient {brand.tokenName}
          </p>
          <h2 className="font-heading text-2xl text-gold-shimmer mb-4">
            More {brand.tokenName} Needed
          </h2>
          <div className="w-10 h-px bg-primary/20 mx-auto mb-5" />

          <p className="text-foreground/40 text-sm leading-relaxed mb-2">
            To unlock
          </p>
          <p className="text-foreground/70 font-heading text-sm tracking-[0.1em] uppercase mb-5">
            {title}
          </p>

          <div className="flex justify-between items-center px-4 py-3 rounded bg-vanta/60 border border-gold/10 mb-3">
            <span className="text-foreground/40 text-xs">Required</span>
            <span className="text-foreground/70 font-heading text-sm">
              {required} {brand.tokenName}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 rounded bg-vanta/60 border border-gold/10 mb-3">
            <span className="text-foreground/40 text-xs">Your Balance</span>
            <span className="text-foreground/70 font-heading text-sm">
              {current} {brand.tokenName}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 rounded bg-accent/5 border border-accent/20 mb-8">
            <span className="text-accent/70 text-xs">You Need</span>
            <span className="text-accent font-heading text-sm">
              {needed} more {brand.tokenName}
            </span>
          </div>

          <a
            href="/dashboard"
            className="block w-full py-3.5 text-sm tracking-[0.2em] rounded transition-all duration-300 btn-crimson text-center mb-3"
          >
            Acquire {brand.tokenName}
          </a>
          <button
            onClick={onClose}
            className="w-full py-3.5 text-sm tracking-[0.2em] rounded transition-all duration-300 btn-ghost-gold"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
