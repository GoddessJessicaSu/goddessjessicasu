"use client";

import { useState, useRef, useCallback } from "react";
import axios from "axios";
import api from "@/lib/api";

export interface FileUploadItem {
  label: string;
  status: "waiting" | "uploading" | "done" | "error";
  progress: number; // 0-100
}

interface MultipartUploadInfo {
  mediaId: string;
  uploadId: string;
  partUrls: { partNumber: number; url: string }[];
  chunkSize: number;
}

export function useFileUpload() {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const updateItem = (index: number, patch: Partial<FileUploadItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      // Recalculate overall progress
      const total = next.reduce((sum, it) => sum + it.progress, 0);
      setOverallProgress(Math.round(total / next.length));
      return next;
    });
  };

  const uploadSingleFile = async (
    url: string,
    file: File,
    itemIndex: number,
    controller: AbortController
  ) => {
    updateItem(itemIndex, { status: "uploading" });
    try {
      await axios.put(url, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        signal: controller.signal,
        onUploadProgress: (e) => {
          if (e.total) {
            updateItem(itemIndex, {
              progress: Math.round((e.loaded / e.total) * 100),
            });
          }
        },
      });
      updateItem(itemIndex, { status: "done", progress: 100 });
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      updateItem(itemIndex, { status: "error" });
      throw err;
    }
  };

  const uploadMultipart = async (
    file: File,
    info: MultipartUploadInfo,
    itemIndex: number,
    controller: AbortController
  ) => {
    updateItem(itemIndex, { status: "uploading" });
    const { partUrls, chunkSize, mediaId, uploadId } = info;
    const completedParts: { partNumber: number; etag: string }[] = [];
    const totalParts = partUrls.length;

    // Upload with concurrency of 3
    const queue = [...partUrls];
    let partsCompleted = 0;

    const partBytesLoaded: Record<number, number> = {};

    const uploadPart = async (part: { partNumber: number; url: string }) => {
      if (cancelledRef.current) return;
      const start = (part.partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const resp = await axios.put(part.url, chunk, {
        headers: { "Content-Type": "application/octet-stream" },
        signal: controller.signal,
        onUploadProgress: (e) => {
          partBytesLoaded[part.partNumber] = e.loaded;
          const totalLoaded = Object.values(partBytesLoaded).reduce((a, b) => a + b, 0);
          updateItem(itemIndex, {
            progress: Math.round((totalLoaded / file.size) * 100),
          });
        },
      });

      const etag = resp.headers["etag"] || resp.headers["ETag"] || "";
      completedParts.push({ partNumber: part.partNumber, etag: etag.replace(/"/g, "") });
      partsCompleted++;
    };

    // Process in batches of 3
    for (let i = 0; i < queue.length; i += 3) {
      if (cancelledRef.current) break;
      const batch = queue.slice(i, i + 3);
      await Promise.all(batch.map(uploadPart));
    }

    if (cancelledRef.current) return;

    // Complete the multipart upload
    completedParts.sort((a, b) => a.partNumber - b.partNumber);
    await api.post(`/admin/media/${mediaId}/complete-multipart`, {
      uploadId,
      parts: completedParts,
    });

    updateItem(itemIndex, { status: "done", progress: 100 });
  };

  const uploadFiles = useCallback(
    async (tasks: {
      previewImages: { file: File; url: string }[];
      previewClip?: { file: File; url: string };
      product:
        | { mode: "single"; file: File; url: string }
        | { mode: "multipart"; file: File; info: MultipartUploadInfo };
    }) => {
      const controller = new AbortController();
      abortRef.current = controller;
      cancelledRef.current = false;
      setError(null);
      setUploading(true);

      // Build items list
      const allItems: FileUploadItem[] = [];
      tasks.previewImages.forEach((img) =>
        allItems.push({ label: img.file.name, status: "waiting", progress: 0 })
      );
      if (tasks.previewClip) {
        allItems.push({ label: `Clip: ${tasks.previewClip.file.name}`, status: "waiting", progress: 0 });
      }
      allItems.push({
        label: `Product: ${tasks.product.file.name}`,
        status: "waiting",
        progress: 0,
      });
      setItems(allItems);
      setOverallProgress(0);

      try {
        let idx = 0;

        // Upload preview images
        for (const img of tasks.previewImages) {
          if (cancelledRef.current) break;
          await uploadSingleFile(img.url, img.file, idx, controller);
          idx++;
        }

        // Upload preview clip
        if (tasks.previewClip && !cancelledRef.current) {
          await uploadSingleFile(tasks.previewClip.url, tasks.previewClip.file, idx, controller);
          idx++;
        }

        // Upload product
        if (!cancelledRef.current) {
          if (tasks.product.mode === "single") {
            await uploadSingleFile(tasks.product.url, tasks.product.file, idx, controller);
          } else {
            await uploadMultipart(
              tasks.product.file,
              tasks.product.info,
              idx,
              controller
            );
          }
        }

        setUploading(false);
        return !cancelledRef.current;
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          setError(err.message || "Upload failed");
        }
        setUploading(false);
        return false;
      }
    },
    []
  );

  const cancel = useCallback(
    async (mediaId?: string, uploadId?: string) => {
      cancelledRef.current = true;
      abortRef.current?.abort();
      setUploading(false);

      // Abort multipart if applicable
      if (mediaId && uploadId) {
        try {
          await api.post(`/admin/media/${mediaId}/abort-multipart`, { uploadId });
        } catch {
          // best effort
        }
      }
    },
    []
  );

  return { items, overallProgress, error, uploading, uploadFiles, cancel };
}
