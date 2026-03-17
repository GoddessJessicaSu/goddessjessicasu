"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "@/lib/api";
import { brand } from "@/lib/brand";
import AddMediaForm from "./AddMediaForm";
import EditableImageGrid, {
  EditableImage,
  ExistingImage,
  NewImage,
} from "./EditableImageGrid";
import UploadProgressOverlay from "./UploadProgressOverlay";
import { FileUploadItem } from "./useFileUpload";

interface EditState {
  title: string;
  description: string;
  priceTokens: string;
}

interface AssetData {
  id: string;
  objectKey: string;
  sortOrder: number;
  url: string;
}

/* ─── Sortable media row (non-edit mode) ─────────────────────────── */

function SortableMediaRow({
  m,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  m: any;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: m.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/5 rounded p-3 border border-white/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50 transition p-1"
            title="Drag to reorder"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>
          <span className="font-medium">{m.title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40 inline-block w-24 text-center">
            {m.priceTokens} {brand.tokenName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/30 inline-block w-24 text-center">
            {m._count?.assets ?? m.assets?.length ?? 0} images
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
            onClick={onEdit}
            className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/10 transition"
          >
            Edit
          </button>
          <button
            onClick={onTogglePublish}
            className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/10 transition"
          >
            {m.isPublished ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm border border-red-900 text-red-400 rounded hover:bg-red-900/30 transition"
          >
            Delete
          </button>
        </div>
      </div>
      {m.description && (
        <p className="text-white/30 text-xs mt-1.5 ml-8 line-clamp-2">
          {m.description}
        </p>
      )}
    </div>
  );
}

/* ─── Main MediaTab ──────────────────────────────────────────────── */

export default function MediaTab() {
  const [media, setMedia] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({
    title: "",
    description: "",
    priceTokens: "",
  });
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Image editing state
  const [editImages, setEditImages] = useState<EditableImage[]>([]);
  const [deletedAssetIds, setDeletedAssetIds] = useState<Set<string>>(
    new Set()
  );
  const [deletingAssetIds, setDeletingAssetIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Upload state for new images
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  const handleMediaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = media.findIndex((m) => m.id === active.id);
    const newIndex = media.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(media, oldIndex, newIndex);
    setMedia(reordered);

    // Persist to backend
    setReordering(true);
    try {
      await api.put("/admin/media-order", {
        order: reordered.map((m) => m.id),
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save order");
      loadMedia(); // revert on error
    } finally {
      setReordering(false);
    }
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

  const startEdit = async (m: any) => {
    setEditingId(m.id);
    setEdit({
      title: m.title,
      description: m.description || "",
      priceTokens: String(m.priceTokens),
    });
    setDeletedAssetIds(new Set());
    setDeletingAssetIds(new Set());

    // Load asset URLs
    setLoadingAssets(true);
    try {
      const res = await api.get(`/admin/media/${m.id}`);
      const assets: AssetData[] = res.data.media.assets;
      setEditImages(
        assets.map((a) => ({
          type: "existing" as const,
          assetId: a.id,
          url: a.url,
        }))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to load preview images");
    } finally {
      setLoadingAssets(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit({ title: "", description: "", priceTokens: "" });
    setEditImages([]);
    setDeletedAssetIds(new Set());
    setDeletingAssetIds(new Set());
  };

  const handleImageRemove = useCallback(
    async (images: EditableImage[], removedImage: EditableImage) => {
      if (removedImage.type === "existing") {
        setDeletingAssetIds((prev) => new Set([...prev, removedImage.assetId]));
        try {
          await api.delete(
            `/admin/media/${editingId}/assets/${removedImage.assetId}`
          );
          setDeletedAssetIds((prev) =>
            new Set([...prev, removedImage.assetId])
          );
          setEditImages((current) =>
            current.filter(
              (img) =>
                !(
                  img.type === "existing" &&
                  img.assetId === removedImage.assetId
                )
            )
          );
        } catch (err: any) {
          alert(
            err.response?.data?.error || "Failed to delete preview image"
          );
        } finally {
          setDeletingAssetIds((prev) => {
            const next = new Set(prev);
            next.delete(removedImage.assetId);
            return next;
          });
        }
      } else {
        setEditImages(images);
      }
    },
    [editingId]
  );

  const handleGridChange = useCallback(
    (newImages: EditableImage[]) => {
      const removedExisting = editImages.find(
        (img) =>
          img.type === "existing" &&
          !newImages.some(
            (n) => n.type === "existing" && n.assetId === img.assetId
          )
      );

      if (removedExisting) {
        handleImageRemove(newImages, removedExisting);
      } else {
        setEditImages(newImages);
      }
    },
    [editImages, handleImageRemove]
  );

  const saveEdit = async (id: string) => {
    const price = parseFloat(edit.priceTokens);
    if (!edit.title.trim()) return alert("Title is required");
    if (isNaN(price) || price < 0) return alert("Invalid price");

    const existingImages = editImages.filter(
      (img) => img.type === "existing"
    ) as ExistingImage[];
    const newImages = editImages.filter(
      (img) => img.type === "new"
    ) as NewImage[];

    if (existingImages.length + newImages.length === 0) {
      return alert("At least 1 preview image is required");
    }

    setSaving(true);

    try {
      // 1. Save metadata
      await api.put(`/admin/media/${id}`, {
        title: edit.title.trim(),
        description: edit.description.trim() || null,
        priceTokens: price,
      });

      // 2. Upload new images if any (via backend for resize)
      if (newImages.length > 0) {
        const res = await api.post(`/admin/media/${id}/assets`, {
          count: newImages.length,
        });
        const newAssets: { assetId: string; sortOrder: number }[] =
          res.data.assets;

        setUploading(true);
        setUploadError(null);
        const items: FileUploadItem[] = newImages.map((img) => ({
          label: img.file.name,
          status: "waiting" as const,
          progress: 0,
        }));
        setUploadItems(items);
        setUploadProgress(0);

        const controller = new AbortController();

        for (let i = 0; i < newImages.length; i++) {
          items[i] = { ...items[i], status: "uploading" };
          setUploadItems([...items]);

          try {
            const buffer = await newImages[i].file.arrayBuffer();
            await api.put(
              `/admin/media/assets/${newAssets[i].assetId}/upload`,
              buffer,
              {
                headers: {
                  "Content-Type": newImages[i].file.type || "image/jpeg",
                },
                signal: controller.signal,
                onUploadProgress: (e) => {
                  if (e.total) {
                    items[i] = {
                      ...items[i],
                      progress: Math.round((e.loaded / e.total) * 100),
                    };
                    setUploadItems([...items]);
                    const total = items.reduce(
                      (sum, it) => sum + it.progress,
                      0
                    );
                    setUploadProgress(Math.round(total / items.length));
                  }
                },
              }
            );
            items[i] = { ...items[i], status: "done", progress: 100 };
            setUploadItems([...items]);
          } catch (err: any) {
            items[i] = { ...items[i], status: "error" };
            setUploadItems([...items]);
            throw err;
          }
        }

        setUploading(false);
      }

      // 3. Reorder all assets
      const updatedRes = await api.get(`/admin/media/${id}`);
      const allAssets: AssetData[] = updatedRes.data.media.assets;

      const existingOrder = existingImages.map((img) => img.assetId);
      const newAssetIds = allAssets
        .filter((a) => !existingOrder.includes(a.id))
        .map((a) => a.id);
      const finalOrder = [...existingOrder, ...newAssetIds];

      if (finalOrder.length > 0) {
        await api.put(`/admin/media/${id}/assets/reorder`, {
          order: finalOrder,
        });
      }

      cancelEdit();
      loadMedia();
    } catch (err: any) {
      setUploading(false);
      alert(err.response?.data?.error || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const mediaIds = media.map((m) => m.id);

  return (
    <div>
      <AddMediaForm onCreated={loadMedia} />

      {reordering && (
        <p className="text-white/40 text-xs mb-2">Saving order...</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleMediaDragEnd}
      >
        <SortableContext
          items={mediaIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {media.map((m: any) =>
              editingId === m.id ? (
                <div
                  key={m.id}
                  className="bg-white/5 rounded-lg p-4 border border-primary/30 space-y-3"
                >
                  {/* Title */}
                  <div>
                    <label className="text-white/40 text-xs block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={edit.title}
                      onChange={(e) =>
                        setEdit({ ...edit, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-white/40 text-xs block mb-1">
                      Description
                    </label>
                    <textarea
                      value={edit.description}
                      onChange={(e) =>
                        setEdit({ ...edit, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white text-sm resize-y focus:border-primary/50 focus:outline-none transition-colors"
                      placeholder="Optional description..."
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-white/40 text-xs block mb-1">
                      Price ({brand.tokenName})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={edit.priceTokens}
                      onChange={(e) =>
                        setEdit({ ...edit, priceTokens: e.target.value })
                      }
                      className="px-3 py-2 bg-black border border-white/15 rounded text-white text-sm w-32 focus:border-primary/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Preview Images */}
                  <div>
                    {loadingAssets ? (
                      <p className="text-white/40 text-sm">
                        Loading preview images...
                      </p>
                    ) : (
                      <EditableImageGrid
                        images={editImages}
                        onChange={handleGridChange}
                        max={10}
                        deleting={deletingAssetIds}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(m.id)}
                      disabled={saving || uploading}
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
                <SortableMediaRow
                  key={m.id}
                  m={m}
                  onEdit={() => startEdit(m)}
                  onTogglePublish={() => togglePublish(m.id, m.isPublished)}
                  onDelete={() => deleteMedia(m.id)}
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      <UploadProgressOverlay
        visible={uploading}
        items={uploadItems}
        overallProgress={uploadProgress}
        onCancel={() => setUploading(false)}
        error={uploadError}
      />
    </div>
  );
}
