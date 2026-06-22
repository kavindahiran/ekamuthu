"use client";

import { useActionState } from "react";
import { createBookingAction } from "@/actions/booking.actions";

interface Props {
  listingId: string;
  maxSeats: number;
}

const initialState = null;

export function BookingForm({ listingId, maxSeats }: Props) {
  const [state, action, isPending] = useActionState(createBookingAction, initialState);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-emerald-800">Request sent!</p>
        <p className="text-sm text-emerald-700 mt-1">
          The host will review your intro and respond soon. You&apos;ll see the status under My Bookings.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="listingId" value={listingId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Introduce yourself to the host
        </label>
        <textarea
          name="introMessage"
          rows={4}
          minLength={20}
          maxLength={500}
          required
          placeholder="Tell the host a little about yourself — why this dinner appeals to you, any dietary notes, who you're bringing..."
          className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none"
        />
        <p className="mt-1 text-xs text-stone-400">Min 20 · max 500 characters</p>
      </div>

      {maxSeats > 1 && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Seats requested
          </label>
          <select
            name="seatsRequested"
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white font-medium text-sm py-3 transition cursor-pointer"
      >
        {isPending ? "Sending request…" : "Request a Seat"}
      </button>

      <p className="text-xs text-stone-400 text-center">
        No payment yet — the host reviews your intro first.
      </p>
    </form>
  );
}
