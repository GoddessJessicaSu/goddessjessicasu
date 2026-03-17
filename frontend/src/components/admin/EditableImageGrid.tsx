"use client";

import { useState } from "react";
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
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FileDropZone from "./FileDropZone";

export interface ExistingImage {
  type: "existing";
  assetId: string;
  url: string;
}

export interface NewImage {
  type: "new";
  file: File;
  tempId: string;
}

export type EditableImage = ExistingImage | NewImage;

interface EditableImageGridProps {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  max?: number;
  deleting?: Set<string>;
}

function SortableEditableItem({
  id,
  image,
  onRemove,
  isDeleting,
}: {
  id: string;
  image: EditableImage;
  onRemove: () => void;
  isDeleting?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isDeleting ? 0.3 : 1,
  };

  const src =
    image.type === "existing" ? image.url : URL.createObjectURL(image.file);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
      {isDeleting ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-white/60 text-xs">Deleting...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/80 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function EditableImageGrid({
  images,
  onChange,
  max = 10,
  deleting,
}: EditableImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ids = images.map((img) =>
    img.type === "existing" ? img.assetId : img.tempId
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleAdd = (newFiles: File[]) => {
    const remaining = max - images.length;
    if (remaining <= 0) return;
    const newImages: NewImage[] = newFiles.slice(0, remaining).map((file) => ({
      type: "new",
      file,
      tempId: `new-${crypto.randomUUID()}`,
    }));
    onChange([...images, ...newImages]);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-white/50 text-sm">Preview Images</label>
        <span className="text-white/30 text-xs">
          {images.length}/{max}
        </span>
      </div>

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map((image, i) => (
                <SortableEditableItem
                  key={ids[i]}
                  id={ids[i]}
                  image={image}
                  onRemove={() => handleRemove(i)}
                  isDeleting={
                    image.type === "existing" && deleting?.has(image.assetId)
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length < max && (
        <FileDropZone
          accept={{ "image/*": [] }}
          maxFiles={max - images.length}
          multiple
          label={
            images.length === 0
              ? "Drag & drop preview images here, or click to browse"
              : "Add more images"
          }
          onFilesSelected={handleAdd}
        />
      )}
    </div>
  );
}
