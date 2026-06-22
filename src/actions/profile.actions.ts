"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ProfileActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const displayName = (formData.get("displayName") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const dietaryPreferences = formData.getAll("dietaryPreferences") as string[];
  const instagramUrl = (formData.get("instagramUrl") as string)?.trim() || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
  const facebookUrl = (formData.get("facebookUrl") as string)?.trim() || null;
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;

  if (displayName && displayName.length > 50) {
    return { error: "Display name must be 50 characters or fewer." };
  }
  if (bio && bio.length > 500) {
    return { error: "Bio must be 500 characters or fewer." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      bio,
      dietaryPreferences: dietaryPreferences as any[],
      instagramUrl,
      linkedinUrl,
      facebookUrl,
      ...(avatarUrl !== null && { avatarUrl }),
    },
  });

  revalidatePath("/profile");
  return { success: true };
}
