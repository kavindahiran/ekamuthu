import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserProfile } from "@/lib/guest.queries";
import { ProfileForm } from "@/components/profile/ProfileForm";

const ID_STATUS = {
  UNVERIFIED: { label: "Not submitted",   style: "bg-stone-100 text-stone-500" },
  PENDING:    { label: "Under review",    style: "bg-amber-100 text-amber-700" },
  VERIFIED:   { label: "Verified",        style: "bg-emerald-100 text-emerald-700" },
  REJECTED:   { label: "Rejected",        style: "bg-red-100 text-red-600" },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/profile");

  const user = await getUserProfile(session.user.id);
  if (!user) redirect("/");

  const displayName = user.displayName ?? user.name;
  const idStatus = ID_STATUS[user.idVerificationStatus] ?? ID_STATUS.UNVERIFIED;

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-amber-700 text-2xl font-bold flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            displayName[0].toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-stone-900">{displayName}</h1>
          <p className="text-sm text-stone-500">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {user.phoneVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                ✓ Phone verified
              </span>
            ) : (
              <Link href="/onboarding/verify-phone" className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 transition">
                ! Verify phone
              </Link>
            )}
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${idStatus.style}`}>
              ID: {idStatus.label}
            </span>
            {user.isHostEligible && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                Host
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      {(user.totalReviewsAsGuest > 0 || user.totalReviewsAsHost > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {user.totalReviewsAsGuest > 0 && (
            <>
              <StatCard label="Guest rating" value={`⭐ ${user.avgRatingAsGuest.toFixed(1)}`} />
              <StatCard label="Dinners attended" value={String(user.totalReviewsAsGuest)} />
            </>
          )}
          {user.totalReviewsAsHost > 0 && (
            <>
              <StatCard label="Host rating" value={`⭐ ${user.avgRatingAsHost.toFixed(1)}`} />
              <StatCard label="Dinners hosted" value={String(user.totalReviewsAsHost)} />
            </>
          )}
        </div>
      )}

      {/* ── Edit form ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-stone-900 mb-5">Edit Profile</h2>
        <ProfileForm
          displayName={user.displayName}
          bio={user.bio}
          dietaryPreferences={user.dietaryPreferences as string[]}
          instagramUrl={user.instagramUrl}
          linkedinUrl={user.linkedinUrl}
          facebookUrl={user.facebookUrl}
          avatarUrl={user.avatarUrl}
          fallbackLetter={displayName[0].toUpperCase()}
        />
      </div>

      {/* ── Account info (read-only) ────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-6 space-y-3">
        <h2 className="text-base font-semibold text-stone-700 mb-1">Account</h2>
        <ReadOnlyField label="Full name" value={user.name} note="Contact support to change" />
        <ReadOnlyField label="Email" value={user.email} note="Used to sign in — cannot be changed" />
        <ReadOnlyField label="Phone" value={user.phone ?? "Not set"} note={user.phoneVerified ? "Verified" : "Not verified"} />
        <ReadOnlyField label="Member since" value={user.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} note="" />
      </div>

      {/* ── ID verification CTA ─────────────────────────────────────── */}
      {user.idVerificationStatus === "UNVERIFIED" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
          <span className="text-2xl flex-shrink-0">🪪</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Verify your identity to unlock hosting</p>
            <p className="text-xs text-amber-700 mt-1">
              Submit your NIC or passport. Once approved by our team, you can apply to become a host.
            </p>
            <Link href="/onboarding/verify-id" className="inline-block mt-3 text-xs font-medium text-amber-700 hover:text-amber-900 underline">
              Start ID verification →
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-4 text-center">
      <p className="text-lg font-bold text-stone-900">{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  );
}

function ReadOnlyField({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-stone-400">{label}</p>
        <p className="text-sm text-stone-700 font-medium">{value}</p>
      </div>
      <p className="text-xs text-stone-400 flex-shrink-0">{note}</p>
    </div>
  );
}
