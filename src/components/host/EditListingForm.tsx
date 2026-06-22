"use client";

import { useActionState, useState } from "react";
import { updateListingAction } from "@/actions/listing.actions";
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

// Format a Date to "YYYY-MM-DDTHH:MM" for datetime-local input
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Format a Date to "HH:MM" for time input
function toTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  listing: SerializedListingForEdit;
}

export function EditListingForm({ listing }: Props) {
  const [state, action, isPending] = useActionState(updateListingAction, null);

  const bookedSeats = listing.totalSeats - listing.seatsAvailable;

  const [menuItems, setMenuItems] = useState<string[]>(
    listing.menuItems.length > 0 ? listing.menuItems : ["", ""]
  );
  const [totalSeats, setTotalSeats] = useState(listing.totalSeats);
  const [coverImageUrl, setCoverImageUrl] = useState(listing.coverImageUrl ?? "");

  const fe = state?.fieldErrors ?? {};

  function addMenuItem() { setMenuItems((p) => [...p, ""]); }
  function removeMenuItem(i: number) { setMenuItems((p) => p.filter((_, idx) => idx !== i)); }
  function updateMenuItem(i: number, val: string) {
    setMenuItems((p) => p.map((item, idx) => (idx === i ? val : item)));
  }

  return (
    <form action={action} className="space-y-8">
      {/* Hidden: listing ID */}
      <input type="hidden" name="listingId" value={listing.id} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {bookedSeats > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ℹ️ {bookedSeats} seat{bookedSeats !== 1 ? "s are" : " is"} already booked. You can increase total seats but not reduce below {bookedSeats}.
        </div>
      )}

      {/* ── Basic info ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Basic Info</h2>

        <div>
          <label className={labelClass}>Dinner title *</label>
          <input
            name="title" type="text" required maxLength={100}
            defaultValue={listing.title}
            placeholder='e.g. "A Sri Lankan Sunday Roast in Colombo 7"'
            className={inputClass}
          />
          {fe.title && <p className={errorClass}>{fe.title}</p>}
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            name="description" rows={5} required minLength={20} maxLength={2000}
            defaultValue={listing.description}
            className={`${inputClass} resize-none`}
          />
          {fe.description && <p className={errorClass}>{fe.description}</p>}
        </div>

        <div>
          <label className={labelClass}>Cuisine type *</label>
          <select name="cuisineType" required defaultValue={listing.cuisineType} className={inputClass}>
            <option value="">Select cuisine</option>
            {CUISINE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {fe.cuisineType && <p className={errorClass}>{fe.cuisineType}</p>}
        </div>
      </section>

      {/* ── Cover photo ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Cover Photo</h2>
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
        <CoverImagePicker
          initialUrl={listing.coverImageUrl ?? undefined}
          onUploaded={setCoverImageUrl}
        />
      </section>

      {/* ── Menu ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Menu</h2>
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                name="menuItems" type="text" value={item}
                onChange={(e) => updateMenuItem(i, e.target.value)}
                placeholder={`Dish ${i + 1}`} maxLength={100}
                className={`${inputClass} flex-1`}
              />
              {menuItems.length > 1 && (
                <button type="button" onClick={() => removeMenuItem(i)}
                  className="text-stone-400 hover:text-red-500 text-lg leading-none px-1 transition cursor-pointer">×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addMenuItem}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium transition cursor-pointer">
          + Add another dish
        </button>
        {fe.menuItems && <p className={errorClass}>{fe.menuItems}</p>}
      </section>

      {/* ── Dietary ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Dietary Tags</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox" name="dietaryTags" value={opt.value}
                defaultChecked={(listing.dietaryTags as string[]).includes(opt.value)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm text-stone-700 group-hover:text-stone-900">{opt.label}</span>
            </label>
          ))}
        </div>
        <div>
          <label className={labelClass}>Dietary notes (optional)</label>
          <textarea
            name="dietaryNotes" rows={2} maxLength={500}
            defaultValue={listing.dietaryNotes ?? ""}
            className={`${inputClass} resize-none`}
          />
        </div>
      </section>

      {/* ── Date & time ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Date & Time</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Dinner date & start time *</label>
            <input name="dinnerDate" type="datetime-local" required
              defaultValue={toDatetimeLocal(new Date(listing.dinnerDate))}
              className={inputClass} />
            {fe.dinnerDate && <p className={errorClass}>{fe.dinnerDate}</p>}
          </div>
          <div>
            <label className={labelClass}>Doors open *</label>
            <input name="doorOpenTime" type="time" required
              defaultValue={toTimeValue(new Date(listing.doorOpenTime))}
              className={inputClass} />
            {fe.doorOpenTime && <p className={errorClass}>{fe.doorOpenTime}</p>}
          </div>
          <div>
            <label className={labelClass}>End time *</label>
            <input name="endTime" type="time" required
              defaultValue={toTimeValue(new Date(listing.endTime))}
              className={inputClass} />
            {fe.endTime && <p className={errorClass}>{fe.endTime}</p>}
          </div>
        </div>
      </section>

      {/* ── Location ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Area / Neighbourhood *</label>
            <input name="area" type="text" required maxLength={100}
              defaultValue={listing.area}
              className={inputClass} />
            {fe.area && <p className={errorClass}>{fe.area}</p>}
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <select name="city" required defaultValue={listing.city} className={inputClass}>
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
        <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-2">Seats & Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Total seats *</label>
            <select name="totalSeats" required value={totalSeats}
              onChange={(e) => setTotalSeats(Number(e.target.value))}
              className={inputClass}>
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n} disabled={n < bookedSeats}>{n} seats{n < bookedSeats ? " (booked)" : ""}</option>
              ))}
            </select>
            {fe.totalSeats && <p className={errorClass}>{fe.totalSeats}</p>}
          </div>
          <div>
            <label className={labelClass}>Max seats per booking *</label>
            <select name="maxSeatsPerBooking" required defaultValue={listing.maxSeatsPerBooking} className={inputClass}>
              {Array.from({ length: totalSeats }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {fe.maxSeatsPerBooking && <p className={errorClass}>{fe.maxSeatsPerBooking}</p>}
          </div>
          <div>
            <label className={labelClass}>Price per seat (LKR) *</label>
            <input name="pricePerSeatLKR" type="number" required min={500} max={50000} step={50}
              defaultValue={Number(listing.pricePerSeatLKR)}
              className={inputClass} />
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
            <select name="genderPolicy" defaultValue={listing.genderPolicy} className={inputClass}>
              <option value="NONE">Open to all</option>
              <option value="FEMALE_ONLY">Female guests only</option>
              <option value="MALE_ONLY">Male guests only</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Minimum age</label>
            <input name="minimumAge" type="number" min={18} max={99}
              defaultValue={listing.minimumAge ?? ""}
              className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Cancellation policy</label>
          <textarea name="cancellationPolicy" rows={2} maxLength={500}
            defaultValue={listing.cancellationPolicy ?? ""}
            className={`${inputClass} resize-none`} />
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────────── */}
      <div className="border-t border-stone-100 pt-6 flex items-center gap-4">
        <button
          type="submit" disabled={isPending}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white font-medium text-sm px-8 py-3 transition cursor-pointer"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
        <a href={`/dinners/${listing.id}`} className="text-sm text-stone-500 hover:text-stone-900 transition">
          Cancel
        </a>
      </div>
    </form>
  );
}
