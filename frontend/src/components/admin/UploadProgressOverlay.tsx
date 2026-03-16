"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileUploadItem } from "./useFileUpload";

interface UploadProgressOverlayProps {
  visible: boolean;
  items: FileUploadItem[];
  overallProgress: number;
  onCancel: () => void;
  error?: string | null;
}

export default function UploadProgressOverlay({
  visible,
  items,
  overallProgress,
  onCancel,
  error,
}: UploadProgressOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Uploading Files
            </h3>

            {/* Overall progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Overall</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Per-file progress */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {items.map((item, i) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between text-white/60 mb-0.5">
                    <span className="truncate mr-2">{item.label}</span>
                    <span className="shrink-0">
                      {item.status === "waiting" && "Waiting"}
                      {item.status === "uploading" && `${item.progress}%`}
                      {item.status === "done" && "Done"}
                      {item.status === "error" && "Error"}
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === "error"
                          ? "bg-red-500"
                          : item.status === "done"
                          ? "bg-green-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            <button
              onClick={onCancel}
              className="w-full px-4 py-2 text-sm border border-white/20 rounded hover:bg-white/10 text-white/70 transition"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
