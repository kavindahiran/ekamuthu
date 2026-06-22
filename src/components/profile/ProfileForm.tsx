"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/actions/profile.actions";
import { AvatarPicker } from "@/components/shared/AvatarPicker";

const DIETARY_OPTIONS = [
  { value: "HALAL",               label: "Halal" },
  { value: "STRICT_BUDDHIST_VEG", label: "Buddhist Veg" },
  { value: "HINDU_VEG",           label: "Hindu Veg" },
  { value: "VEGAN",               label: "Vegan" },
  { value: "LACTO_VEGETARIAN",    label: "Lacto Vegetarian" },
  { value: "NO_BEEF",             label: "No Beef" },
  { value: "NO_PORK",             label: "No Pork" },
  { value: "JAIN",                label: "Jain" },
  { value: "GLUTEN_FREE",         label: "Gluten Free" },
  { value: "NUT_FREE",            label: "Nut Free" },
  { value: "REGULAR_NON_VEG",     label: "Regular Non-Veg" },
];

interface Props {
  displayName: string | null;
  bio: string | null;
  dietaryPreferences: string[];
  instagramUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  avatarUrl: string | null;
  fallbackLetter: string;
}

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";

export function ProfileForm(props: Props) {
  const [state, action, isPending] = useActionState(updateProfileAction, null);
  const [avatarUrl, setAvatarUrl] = useState(props.avatarUrl ?? "");

  return (
    <form action={action} className="space-y-6">

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Profile updated successfully.
        </div>
      )}

      {/* ── Profile photo ───────────────────────────────────── */}
      <div className="flex items-center gap-6 pb-2 border-b border-stone-100">
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <AvatarPicker
          initialUrl={props.avatarUrl}
          fallbackLetter={props.fallbackLetter}
          onUploaded={setAvatarUrl}
          size={80}
        />
        <div>
          <p className="text-sm font-medium text-stone-700">Profile photo</p>
          <p className="text-xs text-stone-400 mt-0.5">JPEG, PNG or WebP · max 3 MB</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Display name</label>
        <input
          name="displayName"
          type="text"
          defaultValue={props.displayName ?? ""}
          maxLength={50}
          placeholder="How you appear to hosts and guests (leave blank to use your real name)"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-400">This is what other users see — your real name stays private.</p>
      </div>

      <div>
        <label className={labelClass}>Bio</label>
        <textarea
          name="bio"
          defaultValue={props.bio ?? ""}
          rows={3}
          maxLength={500}
          placeholder="A little about yourself — your interests, where you're from, what you love about food..."
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-stone-400">Shown on your profile and helps hosts get to know you.</p>
      </div>

      <div>
        <label className={labelClass}>My dietary requirements</label>
        <p className="mb-2 text-xs text-stone-400">Select all that apply. Hosts can filter for compatible dinners.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="dietaryPreferences"
                value={opt.value}
                defaultChecked={props.dietaryPreferences.includes(opt.value)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm text-stone-700 group-hover:text-stone-900">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className={labelClass}>Social links (optional)</label>
        <p className="text-xs text-stone-400 -mt-1">Hosts may look at these to vet your booking request.</p>
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-sm w-20 flex-shrink-0">Instagram</span>
          <input name="instagramUrl" type="url" defaultValue={props.instagramUrl ?? ""} placeholder="https://instagram.com/yourhandle" className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-sm w-20 flex-shrink-0">LinkedIn</span>
          <input name="linkedinUrl" type="url" defaultValue={props.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/yourname" className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-sm w-20 flex-shrink-0">Facebook</span>
          <input name="facebookUrl" type="url" defaultValue={props.facebookUrl ?? ""} placeholder="https://facebook.com/yourprofile" className={inputClass} />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium text-sm px-6 py-2.5 transition cursor-pointer"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

    </form>
  );
}
