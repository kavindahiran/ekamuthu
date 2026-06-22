"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function postQuestionAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const listingId = (formData.get("listingId") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();

  if (!listingId) return { error: "Missing listing." };
  if (!body || body.length < 3) return { error: "Question must be at least 3 characters." };
  if (body.length > 500) return { error: "Question must be 500 characters or fewer." };

  // Listing must exist and be active/full (not cancelled)
  const listing = await prisma.dinnerListing.findUnique({
    where: { id: listingId },
    select: { id: true, status: true },
  });
  if (!listing || listing.status === "CANCELLED") return { error: "Listing not found." };

  await prisma.dinnerQuestion.create({
    data: { listingId, authorId: session.user.id, body },
  });

  revalidatePath(`/dinners/${listingId}`);
  return null;
}

export async function replyToQuestionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const questionId = (formData.get("questionId") as string)?.trim();
  const listingId = (formData.get("listingId") as string)?.trim();
  const replyBody = (formData.get("replyBody") as string)?.trim();

  if (!questionId || !listingId || !replyBody) return;

  // Verify the caller is the host
  const question = await prisma.dinnerQuestion.findUnique({
    where: { id: questionId },
    select: { listing: { select: { hostId: true } } },
  });
  if (question?.listing.hostId !== session.user.id) return;

  await prisma.dinnerQuestion.update({
    where: { id: questionId },
    data: { replyBody, repliedAt: new Date() },
  });

  revalidatePath(`/dinners/${listingId}`);
}

export async function pinQuestionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const questionId = (formData.get("questionId") as string)?.trim();
  const listingId = (formData.get("listingId") as string)?.trim();
  const isPinned = formData.get("isPinned") === "true";

  const question = await prisma.dinnerQuestion.findUnique({
    where: { id: questionId },
    select: { listing: { select: { hostId: true } } },
  });
  if (question?.listing.hostId !== session.user.id) return;

  await prisma.dinnerQuestion.update({
    where: { id: questionId },
    data: { isPinned: !isPinned },
  });

  revalidatePath(`/dinners/${listingId}`);
}
