"use client";

import { useCallback } from "react";
import { useDropzone, Accept } from "react-dropzone";

interface FileDropZoneProps {
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  label: string;
  onFilesSelected: (files: File[]) => void;
  sublabel?: string;
}

export default function FileDropZone({
  accept,
  maxFiles = 1,
  maxSize,
  multiple = false,
  label,
  onFilesSelected,
  sublabel,
}: FileDropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFilesSelected(accepted);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-white/70 text-sm">{label}</p>
      {sublabel && <p className="text-white/40 text-xs mt-1">{sublabel}</p>}
      {isDragActive && (
        <p className="text-primary text-xs mt-1">Drop here...</p>
      )}
    </div>
  );
}
