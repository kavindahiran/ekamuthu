"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type VerificationActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function submitIdVerificationAction(
  _prev: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const nicNumber = (formData.get("nicNumber") as string)?.trim() || null;
  const passportNumber = (formData.get("passportNumber") as string)?.trim() || null;
  const idDocumentUrl = (formData.get("idDocumentUrl") as string)?.trim() || null;

  if (!nicNumber && !passportNumber) {
    return { error: "Please provide your NIC number or passport number." };
  }
  if (!idDocumentUrl) {
    return { error: "Please upload a photo of your ID document." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { idVerificationStatus: true },
  });

  if (user?.idVerificationStatus === "PENDING") {
    return { error: "Your verification is already under review." };
  }
  if (user?.idVerificationStatus === "VERIFIED") {
    return { error: "You are already verified." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(nicNumber && { nicNumber }),
      ...(passportNumber && { passportNumber }),
      idDocumentUrl,
      idVerificationStatus: "PENDING",
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function approveIdVerificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  const userId = formData.get("userId") as string;

  await prisma.user.update({
    where: { id: userId },
    data: {
      idVerificationStatus: "VERIFIED",
      idVerifiedAt: new Date(),
      idVerifiedByAdminId: session.user.id,
      isHostEligible: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/verifications/${userId}`);
  redirect("/admin");
}

export async function rejectIdVerificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  const userId = formData.get("userId") as string;

  await prisma.user.update({
    where: { id: userId },
    data: { idVerificationStatus: "REJECTED" },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/verifications/${userId}`);
  redirect("/admin");
}
