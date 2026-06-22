"use server";

import { auth, update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { redirect } from "next/navigation";

export type SendOtpResult =
  | { error: string }
  | { success: true; phone: string; devOtp?: string };

export type VerifyOtpResult = { error: string } | { success: true };

// Normalise any LK mobile format → E.164 (+94XXXXXXXXX)
function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) return "+94" + d.slice(1);
  if (d.startsWith("94") && d.length === 11) return "+" + d;
  if (d.startsWith("7") && d.length === 9) return "+94" + d;
  return null;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtpAction(
  _prev: SendOtpResult | null,
  formData: FormData
): Promise<SendOtpResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const phone = normalizePhone((formData.get("phone") as string) ?? "");
  if (!phone) {
    return { error: "Enter a valid Sri Lankan mobile number (e.g. 077 123 4567)." };
  }

  // Prevent a number already linked to a different account
  const taken = await prisma.user.findFirst({
    where: { phone, id: { not: session.user.id } },
  });
  if (taken) return { error: "This number is already linked to another account." };

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, phoneOtp: otp, phoneOtpExpiresAt: expiresAt },
  });

  await sendSms(phone, `Your Ekamuthu code: ${otp}. Valid for 10 minutes.`);

  const isDev = !process.env.TWILIO_ACCOUNT_SID;
  return { success: true, phone, ...(isDev && { devOtp: otp }) };
}

export async function verifyOtpAction(
  _prev: VerifyOtpResult | null,
  formData: FormData
): Promise<VerifyOtpResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const input = (formData.get("otp") as string)?.trim();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneOtp: true, phoneOtpExpiresAt: true },
  });

  if (!user?.phoneOtp) {
    return { error: "No pending code found. Please request a new one." };
  }
  if (new Date() > user.phoneOtpExpiresAt!) {
    return { error: "Code has expired. Please request a new one." };
  }
  if (input !== user.phoneOtp) {
    return { error: "Incorrect code. Please check and try again." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneVerified: true, phoneOtp: null, phoneOtpExpiresAt: null },
  });

  // Refresh the JWT so proxy.ts sees phoneVerified: true on the next request
  await update({ user: { phoneVerified: true } });

  redirect("/");
}
