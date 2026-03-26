"use client";

import { useState } from "react";
import api from "@/lib/api";
import { brand } from "@/lib/brand";
import SortableImageGrid from "./SortableImageGrid";
import FileDropZone from "./FileDropZone";
import UploadProgressOverlay from "./UploadProgressOverlay";
import { useFileUpload } from "./useFileUpload";

interface AddMediaFormProps {
  onCreated: () => void;
}

export default function AddMediaForm({ onCreated }: AddMediaFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceTokens, setPriceTokens] = useState("");

  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [previewClipFile, setPreviewClipFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [storjKeys, setStorjKeys] = useState<string[]>([""]);
  const [useStorjKey, setUseStorjKey] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const { items, overallProgress, error, uploading, uploadFiles, cancel } =
    useFileUpload();

  // Track multipart info for cancel
  const [multipartState, setMultipartState] = useState<{
    mediaId: string;
    uploadId: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validStorjKeys = storjKeys.filter((k) => k.trim());
    const needsProductFile = useStorjKey ? validStorjKeys.length === 0 : !productFile;
    if (!title.trim() || !priceTokens || previewImages.length === 0 || needsProductFile) {
      alert("Title, price, at least 1 preview image, and product file (or Storj key) are required.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create media record and get presigned URLs
      const firstKey = useStorjKey ? validStorjKeys[0] : null;
      const productFileName = firstKey
        ? firstKey.split("/").pop() || firstKey
        : productFile!.name;
      const productMime = firstKey
        ? (firstKey.endsWith(".mov") ? "video/quicktime" : "video/mp4")
        : (productFile!.type || "application/octet-stream");

      const res = await api.post("/admin/media", {
        title: title.trim(),
        description: description.trim() || undefined,
        priceTokens: parseFloat(priceTokens),
        productFile: {
          name: productFileName,
          size: useStorjKey ? 0 : productFile!.size,
          mimeType: productMime,
        },
        previewClip: previewClipFile
          ? {
              name: previewClipFile.name,
              size: previewClipFile.size,
              mimeType: previewClipFile.type || "video/mp4",
            }
          : undefined,
        previewImageCount: previewImages.length,
        ...(firstKey && { storjKey: firstKey }),
      });

      const { media, productUpload, previewClipUpload, previewImageAssets } =
        res.data;

      // Track multipart for cancel
      if (productUpload?.mode === "multipart") {
        setMultipartState({
          mediaId: media.id,
          uploadId: productUpload.uploadId,
        });
      }

      // 2. Create MediaFile records for all Storj keys
      if (useStorjKey) {
        for (const key of validStorjKeys) {
          const fname = key.split("/").pop() || key;
          await api.post(`/admin/media/${media.id}/files`, {
            productFile: {
              name: fname,
              mimeType: key.endsWith(".mov") ? "video/quicktime" : "video/mp4",
            },
            storjKey: key,
          });
        }
      }

      // 3. Build upload tasks (images paired by sortOrder)
      const imageUploads = previewImageAssets
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((u: any, i: number) => ({
          file: previewImages[i],
          assetId: u.assetId,
        }));

      let productTask: any = undefined;
      if (!useStorjKey && productUpload) {
        productTask =
          productUpload.mode === "single"
            ? { mode: "single" as const, file: productFile!, url: productUpload.url }
            : {
                mode: "multipart" as const,
                file: productFile!,
                info: {
                  mediaId: media.id,
                  uploadId: productUpload.uploadId,
                  partUrls: productUpload.partUrls,
                  chunkSize: productUpload.chunkSize,
                },
              };
      }

      // 4. Upload all files
      const success = await uploadFiles({
        previewImages: imageUploads,
        previewClip: previewClipUpload && previewClipFile
          ? { file: previewClipFile, url: previewClipUpload.url }
          : undefined,
        ...(productTask && { product: productTask }),
      });

      if (success) {
        // Reset form
        setTitle("");
        setDescription("");
        setPriceTokens("");
        setPreviewImages([]);
        setPreviewClipFile(null);
        setProductFile(null);
        setStorjKeys([""]);
        setUseStorjKey(false);
        setMultipartState(null);
        onCreated();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to create media");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancel(multipartState?.mediaId, multipartState?.uploadId);
    setMultipartState(null);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6"
      >
        <h3 className="font-semibold mb-4">Add New Media</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="px-3 py-2 bg-black border border-white/10 rounded text-white"
          />
          <input
            value={priceTokens}
            onChange={(e) => setPriceTokens(e.target.value)}
            placeholder={`Price (${brand.tokenName})`}
            required
            type="number"
            className="px-3 py-2 bg-black border border-white/10 rounded text-white"
          />
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white mb-4"
        />

        {/* Preview Images — sortable grid */}
        <div className="mb-4">
          <SortableImageGrid
            files={previewImages}
            onChange={setPreviewImages}
            max={10}
          />
        </div>

        {/* Preview Clip — optional single video */}
        <div className="mb-4">
          <label className="text-white/50 text-sm block mb-2">
            Preview Clip (optional)
          </label>
          {previewClipFile ? (
            <div className="flex items-center gap-3 bg-white/5 rounded p-3 border border-white/10">
              <span className="text-white/70 text-sm truncate">
                {previewClipFile.name}
              </span>
              <span className="text-white/30 text-xs shrink-0">
                {(previewClipFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={() => setPreviewClipFile(null)}
                className="ml-auto text-white/40 hover:text-white text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <FileDropZone
              accept={{ "video/*": [] }}
              label="Drag & drop a preview clip, or click to browse"
              onFilesSelected={(files) => setPreviewClipFile(files[0])}
            />
          )}
        </div>

        {/* Product File — required, up to 5GB */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-white/50 text-sm">Product File</label>
            <button
              type="button"
              onClick={() => { setUseStorjKey(!useStorjKey); setProductFile(null); setStorjKeys([""]); }}
              className="text-xs text-primary/70 hover:text-primary underline"
            >
              {useStorjKey ? "Upload file instead" : "Use Storj key instead"}
            </button>
          </div>
          {useStorjKey ? (
            <div className="space-y-2">
              {storjKeys.map((key, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={key}
                    onChange={(e) => {
                      const next = [...storjKeys];
                      next[i] = e.target.value;
                      setStorjKeys(next);
                    }}
                    placeholder="a3f9bc12_video.mp4 (key without products/ prefix)"
                    className="flex-1 px-3 py-2 bg-black border border-white/10 rounded text-white text-sm font-mono"
                  />
                  {storjKeys.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setStorjKeys(storjKeys.filter((_, j) => j !== i))}
                      className="px-2 text-white/30 hover:text-red-400 text-sm transition"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStorjKeys([...storjKeys, ""])}
                className="text-xs text-primary/60 hover:text-primary transition"
              >
                + Add another file
              </button>
            </div>
          ) : productFile ? (
            <div className="flex items-center gap-3 bg-white/5 rounded p-3 border border-white/10">
              <span className="text-white/70 text-sm truncate">
                {productFile.name}
              </span>
              <span className="text-white/30 text-xs shrink-0">
                {productFile.size > 1024 * 1024 * 1024
                  ? `${(productFile.size / 1024 / 1024 / 1024).toFixed(2)} GB`
                  : `${(productFile.size / 1024 / 1024).toFixed(1)} MB`}
              </span>
              <button
                type="button"
                onClick={() => setProductFile(null)}
                className="ml-auto text-white/40 hover:text-white text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <FileDropZone
              label="Drag & drop the product file, or click to browse"
              sublabel="Up to 10 GB"
              maxSize={10 * 1024 * 1024 * 1024}
              onFilesSelected={(files) => setProductFile(files[0])}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="px-6 py-2 bg-primary text-black font-semibold rounded hover:brightness-110 transition disabled:opacity-50"
        >
          {submitting || uploading ? "Uploading..." : "Create & Upload"}
        </button>
      </form>

      <UploadProgressOverlay
        visible={uploading}
        items={items}
        overallProgress={overallProgress}
        onCancel={handleCancel}
        error={error}
      />
    </>
  );
}
