import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveIdVerificationAction, rejectIdVerificationAction } from "@/actions/verification.actions";

interface Props {
  params: Promise<{ userId: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  UNVERIFIED: "bg-stone-100 text-stone-500",
  PENDING:    "bg-amber-100 text-amber-700",
  VERIFIED:   "bg-emerald-100 text-emerald-700",
  REJECTED:   "bg-red-100 text-red-600",
};

export default async function VerificationDetailPage({ params }: Props) {
  const { userId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      nicNumber: true,
      passportNumber: true,
      idDocumentUrl: true,
      idVerificationStatus: true,
      idVerifiedAt: true,
      isHostEligible: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  const displayName = user.displayName ?? user.name;
  const status = user.idVerificationStatus;
  const alreadyDecided = status === "VERIFIED" || status === "REJECTED";

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-700 transition">
          ← Admin
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-sm text-stone-700">ID Verification</span>
      </div>

      {/* User header */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-6">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-semibold flex-shrink-0">
              {displayName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-stone-900">{displayName}</h1>
                {user.displayName && <p className="text-xs text-stone-400">Legal name: {user.name}</p>}
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.UNVERIFIED}`}>
                {status}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-sm text-stone-600">
              <p>{user.email}</p>
              {user.phone && <p>📱 {user.phone}</p>}
              <p className="text-xs text-stone-400">
                Member since {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document numbers */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-6 space-y-3">
        <h2 className="text-sm font-semibold text-stone-700">Submitted ID details</h2>
        {user.nicNumber ? (
          <div>
            <p className="text-xs text-stone-400">NIC number</p>
            <p className="font-mono text-stone-900 font-semibold">{user.nicNumber}</p>
          </div>
        ) : null}
        {user.passportNumber ? (
          <div>
            <p className="text-xs text-stone-400">Passport number</p>
            <p className="font-mono text-stone-900 font-semibold">{user.passportNumber}</p>
          </div>
        ) : null}
        {!user.nicNumber && !user.passportNumber && (
          <p className="text-sm text-stone-400 italic">No document numbers submitted</p>
        )}
      </div>

      {/* Document image */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">ID document photo</h2>
        {user.idDocumentUrl ? (
          <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
            <img
              src={user.idDocumentUrl}
              alt="Submitted ID document"
              className="w-full max-h-[500px] object-contain"
            />
            <div className="p-3 border-t border-stone-100">
              <a
                href={user.idDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 hover:underline"
              >
                Open full size →
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400 italic py-4 text-center border border-dashed border-stone-200 rounded-xl">
            No document photo uploaded
          </p>
        )}
      </div>

      {/* Verdict — only show if still pending */}
      {status === "PENDING" && (
        <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-1">Verdict</h2>
          <p className="text-xs text-stone-400 mb-5">
            Approving will verify the user and grant host eligibility. Rejecting will notify them to re-submit.
          </p>
          <div className="flex gap-3">
            <form action={approveIdVerificationAction} className="flex-1">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 transition cursor-pointer"
              >
                ✓ Approve &amp; grant host access
              </button>
            </form>
            <form action={rejectIdVerificationAction} className="flex-1">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="w-full rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm py-2.5 transition cursor-pointer"
              >
                ✗ Reject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Already decided */}
      {alreadyDecided && (
        <div className={`rounded-xl border px-5 py-4 text-sm ${status === "VERIFIED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {status === "VERIFIED" ? (
            <>✅ Approved — host access granted{user.idVerifiedAt ? ` on ${new Date(user.idVerifiedAt).toLocaleDateString("en-GB")}` : ""}</>
          ) : (
            <>❌ This submission was rejected.</>
          )}
        </div>
      )}

    </div>
  );
}
