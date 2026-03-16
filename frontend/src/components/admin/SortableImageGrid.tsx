"use client";

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
import SortableImageItem from "./SortableImageItem";
import FileDropZone from "./FileDropZone";

interface SortableImageGridProps {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}

export default function SortableImageGrid({
  files,
  onChange,
  max = 10,
}: SortableImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ids = files.map((_, i) => `img-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      onChange(arrayMove(files, oldIndex, newIndex));
    }
  };

  const handleAdd = (newFiles: File[]) => {
    const remaining = max - files.length;
    if (remaining <= 0) return;
    onChange([...files, ...newFiles.slice(0, remaining)]);
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-white/50 text-sm">Preview Images</label>
        <span className="text-white/30 text-xs">
          {files.length}/{max}
        </span>
      </div>

      {files.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((file, i) => (
                <SortableImageItem
                  key={ids[i]}
                  id={ids[i]}
                  file={file}
                  onRemove={() => handleRemove(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {files.length < max && (
        <FileDropZone
          accept={{ "image/*": [] }}
          maxFiles={max - files.length}
          multiple
          label={
            files.length === 0
              ? "Drag & drop preview images here, or click to browse"
              : "Add more images"
          }
          onFilesSelected={handleAdd}
        />
      )}
    </div>
  );
}
