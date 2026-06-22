import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerifyIdForm } from "./VerifyIdForm";

export default async function VerifyIdPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/onboarding/verify-id");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nicNumber: true,
      passportNumber: true,
      idDocumentUrl: true,
      idVerificationStatus: true,
      isHostEligible: true,
    },
  });

  if (!user) redirect("/");

  const status = user.idVerificationStatus;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <span className="text-2xl">🪪</span>
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Verify your identity</h1>
          <p className="mt-1 text-sm text-stone-500">
            Required before you can apply to become a host
          </p>
        </div>

        {/* Already verified */}
        {status === "VERIFIED" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="font-semibold text-stone-900">Identity verified</h2>
            <p className="text-sm text-stone-500">
              Your ID has been reviewed and approved. You are eligible to host dinners.
            </p>
            <Link
              href="/profile"
              className="inline-block rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-6 py-2.5 transition"
            >
              Back to profile
            </Link>
          </div>
        )}

        {/* Pending review */}
        {status === "PENDING" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7 text-center space-y-4">
            <div className="text-4xl">⏳</div>
            <h2 className="font-semibold text-stone-900">Under review</h2>
            <p className="text-sm text-stone-500">
              We received your documents and will review them within 1–2 business days.
              We&apos;ll let you know once it&apos;s done.
            </p>
            <Link
              href="/profile"
              className="inline-block rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-sm px-6 py-2.5 transition"
            >
              Back to profile
            </Link>
          </div>
        )}

        {/* Rejected — allow resubmission */}
        {status === "REJECTED" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7 space-y-6">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              ❌ Your previous submission was rejected. Please re-submit with a clearer photo of your ID.
            </div>
            <VerifyIdForm existing={{ nicNumber: user.nicNumber, passportNumber: user.passportNumber, idDocumentUrl: null }} />
          </div>
        )}

        {/* Not yet submitted */}
        {status === "UNVERIFIED" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7">
            <VerifyIdForm existing={{ nicNumber: user.nicNumber, passportNumber: user.passportNumber, idDocumentUrl: user.idDocumentUrl }} />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-stone-400">
          <Link href="/profile" className="hover:text-stone-600 transition">← Back to profile</Link>
        </p>
      </div>
    </div>
  );
}
