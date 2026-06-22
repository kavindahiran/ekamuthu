"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type BookingActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function createBookingAction(
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session.user.phoneVerified) {
    redirect("/onboarding/verify-phone");
  }

  const listingId = formData.get("listingId") as string;
  const introMessage = (formData.get("introMessage") as string)?.trim();

  if (!listingId) return { error: "Missing listing ID." };
  if (!introMessage || introMessage.length < 20) {
    return { error: "Please write at least 20 characters so the host knows who you are." };
  }
  if (introMessage.length > 500) {
    return { error: "Introduction must be 500 characters or fewer." };
  }

  // Fetch listing inside a transaction to atomically check seats + create booking
  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.dinnerListing.findUnique({
        where: { id: listingId },
        select: { id: true, status: true, seatsAvailable: true, hostId: true },
      });

      if (!listing) throw new Error("LISTING_NOT_FOUND");
      if (listing.status !== "ACTIVE") throw new Error("LISTING_NOT_ACTIVE");
      if (listing.seatsAvailable < 1) throw new Error("NO_SEATS");
      if (listing.hostId === session.user.id) throw new Error("HOST_CANNOT_BOOK");

      const existing = await tx.booking.findUnique({
        where: { guestId_listingId: { guestId: session.user.id, listingId } },
      });
      if (existing) throw new Error("ALREADY_BOOKED");

      await tx.booking.create({
        data: {
          guestId: session.user.id,
          listingId,
          introMessage,
          status: "PENDING",
        },
      });
    });

    return { success: true };
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg === "LISTING_NOT_FOUND") return { error: "This dinner no longer exists." };
    if (msg === "LISTING_NOT_ACTIVE") return { error: "This dinner is no longer accepting bookings." };
    if (msg === "NO_SEATS") return { error: "Sorry, this dinner is now full." };
    if (msg === "HOST_CANNOT_BOOK") return { error: "You cannot book your own dinner." };
    if (msg === "ALREADY_BOOKED") return { error: "You have already sent a request for this dinner." };
    console.error("[createBookingAction]", err);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function approveBookingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const bookingId = formData.get("bookingId") as string;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, listing: { select: { hostId: true } } },
  });

  if (!booking || booking.listing.hostId !== session.user.id) return;
  if (booking.status !== "PENDING") return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "APPROVED", respondedAt: new Date() },
  });

  revalidatePath("/host/dashboard");
}

export async function rejectBookingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const bookingId = formData.get("bookingId") as string;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, listing: { select: { hostId: true } } },
  });

  if (!booking || booking.listing.hostId !== session.user.id) return;
  if (booking.status !== "PENDING") return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });

  revalidatePath("/host/dashboard");
}
