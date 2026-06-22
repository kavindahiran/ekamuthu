"use client";

import { useRef, useState } from "react";

interface Props {
  onUploaded: (url: string) => void;
  initialUrl?: string | null;
  /** Letter shown in the fallback circle (first letter of name) */
  fallbackLetter?: string;
  /** Size of the circle in px — default 96 */
  size?: number;
}

export function AvatarPicker({ onUploaded, initialUrl, fallbackLetter = "?", size = 96 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Must be under 3 MB.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        setPreview(initialUrl ?? null);
        return;
      }
      onUploaded(json.url as string);
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(initialUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const px = `${size}px`;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative rounded-full overflow-hidden ring-4 ring-white shadow-md cursor-pointer group focus:outline-none focus:ring-amber-400"
        style={{ width: px, height: px }}
        title="Change photo"
      >
        {/* Avatar or initial */}
        {preview ? (
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold select-none"
            style={{ fontSize: size * 0.38 }}
          >
            {fallbackLetter.toUpperCase()}
          </div>
        )}

        {/* Hover / uploading overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity
          ${uploading ? "bg-black/50 opacity-100" : "bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100"}`}>
          {uploading ? (
            <span className="text-white text-xs font-medium animate-pulse">Uploading…</span>
          ) : (
            <>
              <span className="text-white text-xl">📷</span>
              <span className="text-white text-[10px] mt-0.5 font-medium">Change</span>
            </>
          )}
        </div>
      </button>

      <p className="text-xs text-stone-400">
        {preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            Change photo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            + Add photo
          </button>
        )}
        {" "}
        <span className="text-stone-300">(optional)</span>
      </p>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
