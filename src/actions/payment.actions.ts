"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type PaymentActionState = {
  error?: string;
  success?: boolean;
} | null;

// ── Bank transfer submission ──────────────────────────────────────────────────
// Guest submits after they've made the bank transfer. Creates a PENDING payment
// that admin must confirm.

export async function submitBankTransferAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const bookingId = formData.get("bookingId") as string;
  const bankRef = (formData.get("bankRef") as string)?.trim();
  const bankName = (formData.get("bankName") as string)?.trim() || null;

  if (!bankRef || bankRef.length < 4) {
    return { error: "Please enter your bank reference number." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestId: true,
      status: true,
      seatsRequested: true,
      listing: { select: { pricePerSeatLKR: true } },
      payment: { select: { id: true, status: true } },
    },
  });

  if (!booking || booking.guestId !== session.user.id) {
    return { error: "Booking not found." };
  }
  if (booking.status !== "APPROVED") {
    return { error: "This booking is not awaiting payment." };
  }
  if (booking.payment?.status === "COMPLETED") {
    return { error: "Payment already completed." };
  }

  const amountLKR = Number(booking.listing.pricePerSeatLKR) * booking.seatsRequested;

  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amountLKR,
      paymentMethod: "BANK_TRANSFER",
      paymentGateway: "MANUAL",
      status: "PENDING",
      bankRef,
      bankName,
    },
    update: {
      paymentMethod: "BANK_TRANSFER",
      paymentGateway: "MANUAL",
      status: "PENDING",
      bankRef,
      bankName,
      transactionRef: null, // clear PayHere ref if switching methods
    },
  });

  revalidatePath("/guest/bookings");
  return { success: true };
}

// ── Admin: confirm bank transfer ──────────────────────────────────────────────
// Admin reviews the receipt and marks the payment complete. This atomically:
//   1. Marks Payment → COMPLETED
//   2. Marks Booking → PAID
//   3. Decrements seatsAvailable on the listing
//   4. If seatsAvailable hits 0 → marks listing FULL

export async function confirmBankTransferAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const paymentId = formData.get("paymentId") as string;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        booking: {
          select: {
            id: true,
            seatsRequested: true,
            listingId: true,
          },
        },
      },
    });

    if (!payment || payment.status !== "PENDING") return;

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", paidAt: new Date() },
    });

    await tx.booking.update({
      where: { id: payment.booking.id },
      data: { status: "PAID" },
    });

    const listing = await tx.dinnerListing.update({
      where: { id: payment.booking.listingId },
      data: { seatsAvailable: { decrement: payment.booking.seatsRequested } },
      select: { seatsAvailable: true },
    });

    if (listing.seatsAvailable <= 0) {
      await tx.dinnerListing.update({
        where: { id: payment.booking.listingId },
        data: { status: "FULL" },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
}

export async function rejectBankTransferAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const paymentId = formData.get("paymentId") as string;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED", failureReason: "Rejected by admin — payment not verified" },
  });

  revalidatePath("/admin/payments");
}
