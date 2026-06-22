"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ReviewActionState = { error?: string; success?: boolean } | null;

export async function submitReviewAction(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const bookingId = formData.get("bookingId") as string;
  const ratingRaw = formData.get("rating") as string;
  const comment = (formData.get("comment") as string)?.trim();

  const rating = parseInt(ratingRaw, 10);
  if (!rating || rating < 1 || rating > 5) {
    return { error: "Please select a star rating." };
  }
  if (!comment || comment.length < 10) {
    return { error: "Please write at least 10 characters." };
  }
  if (comment.length > 1000) {
    return { error: "Review must be 1000 characters or fewer." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestId: true,
      listingId: true,
      status: true,
      listing: { select: { dinnerDate: true, hostId: true } },
      reviews: { where: { reviewerId: session.user.id }, select: { id: true } },
    },
  });

  if (!booking) return { error: "Booking not found." };
  if (booking.guestId !== session.user.id) return { error: "Forbidden." };
  if (!["PAID", "ATTENDED"].includes(booking.status)) {
    return { error: "You can only review dinners you attended." };
  }
  if (new Date(booking.listing.dinnerDate) > new Date()) {
    return { error: "The dinner hasn't happened yet." };
  }
  if (booking.reviews.length > 0) {
    return { error: "You have already reviewed this dinner." };
  }

  await prisma.review.create({
    data: {
      reviewerId: session.user.id,
      revieweeId: booking.listing.hostId,
      bookingId,
      listingId: booking.listingId,
      type: "GUEST_REVIEWS_HOST",
      rating,
      comment,
    },
  });

  // Recalculate host rating
  const hostReviews = await prisma.review.findMany({
    where: { revieweeId: booking.listing.hostId, type: "GUEST_REVIEWS_HOST" },
    select: { rating: true },
  });
  const hostAvg = hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length;
  await prisma.user.update({
    where: { id: booking.listing.hostId },
    data: {
      avgRatingAsHost: parseFloat(hostAvg.toFixed(2)),
      totalReviewsAsHost: hostReviews.length,
    },
  });

  revalidatePath(`/dinners/${booking.listingId}`);
  revalidatePath("/guest/bookings");
  redirect("/guest/bookings");
}
