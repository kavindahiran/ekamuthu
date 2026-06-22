"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

type ActionResult = { error: string } | { success: true };

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash, avatarUrl },
  });

  // Auto sign-in then redirect to phone verification
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/onboarding/verify-phone",
  });

  return { success: true };
}
