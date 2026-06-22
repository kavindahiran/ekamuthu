"use client";

import { useActionState, useState, useRef } from "react";
import { submitIdVerificationAction } from "@/actions/verification.actions";

interface Props {
  existing: {
    nicNumber: string | null;
    passportNumber: string | null;
    idDocumentUrl: string | null;
  };
}

export function VerifyIdForm({ existing }: Props) {
  const [state, action, isPending] = useActionState(submitIdVerificationAction, null);
  const [docUrl, setDocUrl] = useState(existing.idDocumentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/id-document", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDocUrl(data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition";

  return (
    <form action={action} className="space-y-6">

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          ✅ Submitted! Our team will review your ID within 1–2 business days.
        </div>
      )}

      {/* NIC */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          NIC number <span className="text-stone-400 font-normal">(optional if passport provided)</span>
        </label>
        <input
          name="nicNumber"
          type="text"
          defaultValue={existing.nicNumber ?? ""}
          placeholder="e.g. 991234567V or 199912345678"
          className={inputClass}
        />
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* Passport */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Passport number <span className="text-stone-400 font-normal">(optional if NIC provided)</span>
        </label>
        <input
          name="passportNumber"
          type="text"
          defaultValue={existing.passportNumber ?? ""}
          placeholder="e.g. N1234567"
          className={inputClass}
        />
      </div>

      {/* ID Document Photo */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Photo of your ID document <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-stone-400 mb-3">
          Front side of your NIC or passport data page. JPEG, PNG or WebP · max 5 MB.
        </p>

        <input type="hidden" name="idDocumentUrl" value={docUrl} />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />

        {docUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
            <img src={docUrl} alt="ID document" className="w-full max-h-48 object-contain" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 rounded-lg bg-white/90 border border-stone-200 text-xs font-medium text-stone-700 px-3 py-1.5 hover:bg-white transition cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50 transition py-8 flex flex-col items-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">{uploading ? "⏳" : "📷"}</span>
            <span className="text-sm font-medium text-stone-600">
              {uploading ? "Uploading…" : "Upload ID photo"}
            </span>
            <span className="text-xs text-stone-400">Click to choose file</span>
          </button>
        )}

        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800 space-y-1">
        <p className="font-medium">🔒 Your privacy matters</p>
        <p>Your ID document is only used to verify your identity. It is never shared with hosts or other users.</p>
      </div>

      <button
        type="submit"
        disabled={isPending || uploading || !docUrl || state?.success}
        className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium text-sm py-3 transition cursor-pointer"
      >
        {isPending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
