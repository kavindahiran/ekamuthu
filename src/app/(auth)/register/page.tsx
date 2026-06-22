"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/actions/auth.actions";
import { AvatarPicker } from "@/components/shared/AvatarPicker";
import Link from "next/link";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");

  // First letter of name for the avatar fallback
  const fallbackLetter = name.trim()[0] ?? "?";

  return (
    <>
      <h1 className="text-xl font-semibold text-stone-900 mb-6 text-center">
        Create your account
      </h1>

      {state && "error" in state && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">

        {/* ── Avatar (optional) ─────────────────────────────── */}
        <div className="flex justify-center pb-2">
          <input type="hidden" name="avatarUrl" value={avatarUrl} />
          <AvatarPicker
            onUploaded={setAvatarUrl}
            fallbackLetter={fallbackLetter}
            size={88}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Full name
          </label>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Kavinda Perera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Confirm password
          </label>
          <input
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white font-medium text-sm py-2.5 transition cursor-pointer"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-amber-600 hover:text-amber-700">
          Sign in
        </Link>
      </p>
    </>
  );
}
