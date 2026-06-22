"use client";

import { useActionState } from "react";
import { submitReviewAction } from "@/actions/review.actions";
import { StarRatingPicker } from "./StarRatingPicker";

interface Props {
  bookingId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  dinnerTitle: string;
}

export function ReviewForm({ bookingId, hostName, hostAvatarUrl, dinnerTitle }: Props) {
  const [state, action, isPending] = useActionState(submitReviewAction, null);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="bookingId" value={bookingId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Host info */}
      <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
        {hostAvatarUrl ? (
          <img src={hostAvatarUrl} alt={hostName} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-lg flex-shrink-0">
            {hostName[0]}
          </div>
        )}
        <div>
          <p className="text-xs text-stone-400">You&apos;re reviewing</p>
          <p className="font-semibold text-stone-900">{hostName}</p>
          <p className="text-xs text-stone-500">{dinnerTitle}</p>
        </div>
      </div>

      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">Overall rating</label>
        <StarRatingPicker name="rating" />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Your review
        </label>
        <textarea
          name="comment"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          placeholder="Share your experience — the food, the atmosphere, the host... anything that would help future guests."
          className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none"
        />
        <p className="mt-1 text-xs text-stone-400">Minimum 10 characters · max 1000</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium text-sm py-3 transition cursor-pointer"
      >
        {isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
