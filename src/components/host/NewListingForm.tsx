"use client";

import { useActionState, useState } from "react";
import { createListingAction } from "@/actions/listing.actions";
import { CoverImagePicker } from "./CoverImagePicker";
import type { SerializedListingForEdit } from "@/lib/host.queries";

const CUISINE_OPTIONS = [
  { value: "SRI_LANKAN",     label: "Sri Lankan" },
  { value: "SOUTH_INDIAN",   label: "South Indian" },
  { value: "NORTH_INDIAN",   label: "North Indian" },
  { value: "CHINESE",        label: "Chinese" },
  { value: "WESTERN",        label: "Western" },
  { value: "MIDDLE_EASTERN", label: "Middle Eastern" },
  { value: "FUSION",         label: "Fusion" },
  { value: "OTHER",          label: "Other" },
];

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

const LK_CITIES = [
  "Colombo", "Kandy", "Galle", "Jaffna", "Negombo",
  "Matara", "Kurunegala", "Anuradhapura", "Batticaloa",
  "Trincomalee", "Ratnapura", "Badulla", "Hambantota",
];

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";
const errorClass = "mt-1 text-xs text-red-600";

interface Props {
  prefill?: SerializedListingForEdit;
}

export function NewListingForm({ prefill }: Props) {
  const [state, action, isPending] = useActionState(createListingAction, null);

  const [menuItems, setMenuItems] = useState<string[]>(
    prefill?.menuItems?.length ? prefill.menuItems : ["", ""]
  );
  const [totalSeats, setTotalSeats] = useState(prefill?.totalSeats ?? 4);
  const [coverImageUrl, setCoverImageUrl] = useState(prefill?.coverImageUrl ?? "");

  const dietaryTagsArray = (prefill?.dietaryTags ?? []) as string[];

  const fe = state?.fieldErrors ?? {};

  function addMenuItem() {
    setMenuItems((prev) => [...prev, ""]);
  }
  function removeMenuItem(i: number) {
    setMenuItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateMenuItem(i: number, val: string) {
    setMenuItems((prev) => prev.map((item, idx) => (idx === i ? val : item)));
  }

  return (
    <form action={action} className="space-y-8">

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {prefill && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Pre-filled from <span className="font-semibold">{prefill.title}</span>. Set a new date below — everything else is ready to go.
        </div>
      )}

      {/* ── Basic info ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Basic Info</h2>

        <div>
          <label className={labelClass}>Dinner title *</label>
          <input name="title" type="text" required maxLength={100} defaultValue={prefill?.title ?? ""} placeholder='e.g. "A Sri Lankan Sunday Roast in Colombo 7"' className={inputClass} />
          {fe.title && <p className={errorClass}>{fe.title}</p>}
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea name="description" rows={5} required minLength={20} maxLength={2000} defaultValue={prefill?.description ?? ""} placeholder="Tell guests about the experience — the atmosphere, what makes your table special, your story as a cook..." className={`${inputClass} resize-none`} />
          {fe.description && <p className={errorClass}>{fe.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cuisine type *</label>
            <select name="cuisineType" required defaultValue={prefill?.cuisineType ?? ""} className={inputClass}>
              <option value="">Select cuisine</option>
              {CUISINE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {fe.cuisineType && <p className={errorClass}>{fe.cuisineType}</p>}
          </div>
        </div>
      </section>

      {/* ── Cover photo ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Cover Photo</h2>
        <p className="text-sm text-stone-500">
          Add a photo of your food or dining space. This is the first thing guests see — a great image increases bookings.
          If you skip this, we&apos;ll use a default image based on your cuisine type.
        </p>
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
        <CoverImagePicker onUploaded={setCoverImageUrl} initialUrl={prefill?.coverImageUrl ?? undefined} />
      </section>

      {/* ── Menu ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Menu</h2>
        <p className="text-sm text-stone-500">List the dishes you&apos;ll serve. Each item appears as a bullet on the listing.</p>

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                name="menuItems"
                type="text"
                value={item}
                onChange={(e) => updateMenuItem(i, e.target.value)}
                placeholder={`Dish ${i + 1}`}
                maxLength={100}
                className={`${inputClass} flex-1`}
              />
              {menuItems.length > 1 && (
                <button type="button" onClick={() => removeMenuItem(i)} className="text-stone-400 hover:text-red-500 text-lg leading-none px-1 transition cursor-pointer">×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addMenuItem} className="text-sm text-amber-600 hover:text-amber-700 font-medium transition cursor-pointer">
          + Add another dish
        </button>
        {fe.menuItems && <p className={errorClass}>{fe.menuItems}</p>}
      </section>

      {/* ── Dietary ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Dietary Tags</h2>
        <p className="text-sm text-stone-500">Select all that apply. These help guests find your dinner with the right filters.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="dietaryTags"
                value={opt.value}
                defaultChecked={dietaryTagsArray.includes(opt.value)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm text-stone-700 group-hover:text-stone-900">{opt.label}</span>
            </label>
          ))}
        </div>

        <div>
          <label className={labelClass}>Dietary notes (optional)</label>
          <textarea name="dietaryNotes" rows={2} maxLength={500} defaultValue={prefill?.dietaryNotes ?? ""} placeholder="e.g. All dishes are cooked in a separate halal kitchen. No cross-contamination." className={`${inputClass} resize-none`} />
        </div>
      </section>

      {/* ── Date & time ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">
          Date &amp; Time
          {prefill && <span className="ml-2 text-amber-600 font-normal text-sm">— pick new dates for this run</span>}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Dinner date &amp; start time *</label>
            <input name="dinnerDate" type="datetime-local" required className={inputClass} />
            {fe.dinnerDate && <p className={errorClass}>{fe.dinnerDate}</p>}
          </div>
          <div>
            <label className={labelClass}>Doors open *</label>
            <input name="doorOpenTime" type="time" required className={inputClass} />
            {fe.doorOpenTime && <p className={errorClass}>{fe.doorOpenTime}</p>}
          </div>
          <div>
            <label className={labelClass}>End time *</label>
            <input name="endTime" type="time" required className={inputClass} />
            {fe.endTime && <p className={errorClass}>{fe.endTime}</p>}
          </div>
        </div>
      </section>

      {/* ── Location ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Location</h2>
        <p className="text-sm text-stone-500">Your exact address is kept private — guests only see area and city until their booking is approved.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Area / Neighbourhood *</label>
            <input name="area" type="text" required maxLength={100} defaultValue={prefill?.area ?? ""} placeholder='e.g. "Colombo 3", "Kandy City", "Galle Fort"' className={inputClass} />
            {fe.area && <p className={errorClass}>{fe.area}</p>}
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <select name="city" required defaultValue={prefill?.city ?? ""} className={inputClass}>
              <option value="">Select city</option>
              {LK_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {fe.city && <p className={errorClass}>{fe.city}</p>}
          </div>
        </div>
      </section>

      {/* ── Seats & pricing ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Seats &amp; Pricing</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Total seats *</label>
            <select
              name="totalSeats"
              required
              value={totalSeats}
              onChange={(e) => setTotalSeats(Number(e.target.value))}
              className={inputClass}
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} seats</option>
              ))}
            </select>
            {fe.totalSeats && <p className={errorClass}>{fe.totalSeats}</p>}
          </div>
          <div>
            <label className={labelClass}>Max seats per booking *</label>
            <select name="maxSeatsPerBooking" required defaultValue={prefill?.maxSeatsPerBooking ?? 1} className={inputClass}>
              {Array.from({ length: totalSeats }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {fe.maxSeatsPerBooking && <p className={errorClass}>{fe.maxSeatsPerBooking}</p>}
          </div>
          <div>
            <label className={labelClass}>Price per seat (LKR) *</label>
            <input name="pricePerSeatLKR" type="number" required min={500} max={50000} step={50} defaultValue={prefill ? Number(prefill.pricePerSeatLKR) : ""} placeholder="2500" className={inputClass} />
            {fe.pricePerSeatLKR && <p className={errorClass}>{fe.pricePerSeatLKR}</p>}
          </div>
        </div>
      </section>

      {/* ── House rules ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">House Rules (optional)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Gender policy</label>
            <select name="genderPolicy" defaultValue={prefill?.genderPolicy ?? "NONE"} className={inputClass}>
              <option value="NONE">Open to all</option>
              <option value="FEMALE_ONLY">Female guests only</option>
              <option value="MALE_ONLY">Male guests only</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Minimum age</label>
            <input name="minimumAge" type="number" min={18} max={99} defaultValue={prefill?.minimumAge ?? ""} placeholder="e.g. 21" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Cancellation policy</label>
          <textarea name="cancellationPolicy" rows={2} maxLength={500} defaultValue={prefill?.cancellationPolicy ?? ""} placeholder="e.g. Full refund if cancelled 48 hours before the dinner." className={`${inputClass} resize-none`} />
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────────── */}
      <div className="border-t border-stone-100 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white font-medium text-sm px-8 py-3 transition cursor-pointer"
        >
          {isPending ? "Publishing…" : "Publish Dinner"}
        </button>
        <p className="mt-2 text-xs text-stone-400">
          Your listing goes live immediately and guests can start sending requests.
        </p>
      </div>

    </form>
  );
}
