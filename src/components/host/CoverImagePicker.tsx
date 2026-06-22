"use client";

import { useRef, useState } from "react";

interface Props {
  /** Called with the uploaded public URL (e.g. /uploads/listings/abc.jpg) */
  onUploaded: (url: string) => void;
  /** Pre-existing image URL shown on mount (edit mode) */
  initialUrl?: string;
}

export function CoverImagePicker({ onUploaded, initialUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    // Client-side guard (server also validates)
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    // Show instant local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/listing-image", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        setPreview(null);
        return;
      }
      onUploaded(json.url as string);
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearImage() {
    setPreview(null);
    setError(null);
    onUploaded(""); // clear the hidden input in parent
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {preview ? (
        /* Preview state */
        <div className="relative rounded-xl overflow-hidden border border-stone-200 h-52 bg-stone-100">
          <img src={preview} alt="Cover preview" className="h-full w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-medium animate-pulse">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70 text-white h-7 w-7 flex items-center justify-center text-lg leading-none transition cursor-pointer"
              title="Remove image"
            >
              ×
            </button>
          )}
          {!uploading && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-xs text-white/80">✓ Image uploaded</p>
            </div>
          )}
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          className={`w-full h-40 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center gap-2 cursor-pointer
            ${isDragOver
              ? "border-amber-500 bg-amber-50"
              : "border-stone-200 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/50"
            }`}
        >
          <span className="text-3xl">🖼️</span>
          <p className="text-sm font-medium text-stone-600">
            Click to upload <span className="text-stone-400 font-normal">or drag & drop</span>
          </p>
          <p className="text-xs text-stone-400">JPEG, PNG, WebP · max 5 MB</p>
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
