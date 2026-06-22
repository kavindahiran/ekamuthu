import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getHostDashboard } from "@/lib/host.queries";
import { approveBookingAction, rejectBookingAction } from "@/actions/booking.actions";

const CUISINE_PHOTO: Record<string, string> = {
  SRI_LANKAN:     "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=70",
  SOUTH_INDIAN:   "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=70",
  NORTH_INDIAN:   "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=70",
  CHINESE:        "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=70",
  WESTERN:        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=70",
  MIDDLE_EASTERN: "https://images.unsplash.com/photo-1544250634-b6384927a14d?w=400&q=70",
  FUSION:         "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=70",
  OTHER:          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-stone-100 text-stone-600",
  ACTIVE:    "bg-emerald-100 text-emerald-700",
  FULL:      "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-stone-100 text-stone-500",
};

const BOOKING_STATUS_STYLE: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  PAID:     "bg-blue-100 text-blue-700",
};

export default async function HostDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!session.user.isHostEligible) redirect("/");

  const listings = await getHostDashboard(session.user.id);

  const upcoming = listings.filter((l) => new Date(l.dinnerDate) >= new Date());
  const past = listings.filter((l) => new Date(l.dinnerDate) < new Date());

  const pendingCount = upcoming.reduce(
    (sum, l) => sum + l.bookings.filter((b) => b.status === "PENDING").length,
    0
  );

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Host Dashboard</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">
              {pendingCount} booking request{pendingCount !== 1 ? "s" : ""} waiting for your response
            </p>
          )}
        </div>
        <Link
          href="/host/new"
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2.5 transition"
        >
          + New Dinner
        </Link>
      </div>

      {/* ── No listings state ───────────────────────────────────────── */}
      {listings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-200 py-20 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium text-stone-700">No dinners yet</p>
          <p className="text-sm text-stone-400 mt-1 mb-5">List your first home dinner and start hosting</p>
          <Link
            href="/host/new"
            className="inline-block rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-5 py-2.5 transition"
          >
            Create your first dinner
          </Link>
        </div>
      )}

      {/* ── Upcoming dinners ────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-base font-semibold text-stone-700">Upcoming Dinners</h2>
          {upcoming.map((listing) => {
            const pending = listing.bookings.filter((b) => b.status === "PENDING");
            const approved = listing.bookings.filter((b) => b.status === "APPROVED");
            const paid = listing.bookings.filter((b) => b.status === "PAID");
            const date = new Date(listing.dinnerDate);

            return (
              <div key={listing.id} className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
                {/* Listing header — cover image strip */}
                <div className="relative h-28 bg-stone-100 overflow-hidden">
                  <img
                    src={listing.coverImageUrl || CUISINE_PHOTO[listing.cuisineType] || CUISINE_PHOTO.OTHER}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Status badge + title overlay */}
                  <div className="absolute bottom-0 inset-x-0 px-4 pb-3 flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dinners/${listing.id}`}
                        className="font-semibold text-white hover:text-amber-300 transition truncate block leading-snug"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-xs text-white/70 mt-0.5">
                        📅 {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        {" · "}📍 {listing.area}, {listing.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/host/dinners/${listing.id}/edit`}
                        className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white transition"
                      >
                        Edit
                      </Link>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[listing.status] ?? STATUS_STYLE.DRAFT}`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between gap-4 text-xs">
                  <span className="text-stone-500">
                    🪑 {listing.seatsAvailable}/{listing.totalSeats} seats · LKR {Number(listing.pricePerSeatLKR).toLocaleString("en-LK")}
                  </span>
                  <div className="flex gap-2">
                    {paid.length > 0 && <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">{paid.length} paid</span>}
                    {approved.length > 0 && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">{approved.length} approved</span>}
                    {pending.length > 0 && <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-semibold">{pending.length} pending</span>}
                  </div>
                </div>

                {/* Booking requests */}
                {listing.bookings.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-stone-400">No booking requests yet.</p>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {listing.bookings.map((booking) => {
                      const guestName = booking.guest.displayName ?? booking.guest.name;
                      const timeAgo = formatTimeAgo(new Date(booking.createdAt));
                      return (
                        <div key={booking.id} className="px-5 py-4 flex items-start gap-4">
                          {/* Guest avatar */}
                          {booking.guest.avatarUrl ? (
                            <img src={booking.guest.avatarUrl} alt={guestName} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                              {guestName[0]}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-stone-900 text-sm">{guestName}</span>
                              {booking.guest.totalReviewsAsGuest > 0 && (
                                <span className="text-xs text-stone-400">⭐ {booking.guest.avgRatingAsGuest.toFixed(1)}</span>
                              )}
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BOOKING_STATUS_STYLE[booking.status] ?? ""}`}>
                                {booking.status}
                              </span>
                              <span className="text-xs text-stone-400">{timeAgo}</span>
                            </div>
                            <p className="mt-1 text-sm text-stone-600 leading-relaxed line-clamp-2">
                              {booking.introMessage}
                            </p>
                          </div>

                          {/* Actions — only for PENDING */}
                          {booking.status === "PENDING" && (
                            <div className="flex gap-2 flex-shrink-0">
                              <form action={approveBookingAction}>
                                <input type="hidden" name="bookingId" value={booking.id} />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 transition cursor-pointer"
                                >
                                  Approve
                                </button>
                              </form>
                              <form action={rejectBookingAction}>
                                <input type="hidden" name="bookingId" value={booking.id} />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium px-3 py-1.5 transition cursor-pointer"
                                >
                                  Decline
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── Past dinners ─────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-400">Past Dinners</h2>
          {past.map((listing) => (
            <div key={listing.id} className="rounded-xl border border-stone-100 bg-white flex items-center gap-3 overflow-hidden">
              {/* Thumbnail */}
              <div className="h-16 w-20 flex-shrink-0 bg-stone-100 overflow-hidden opacity-60">
                <img
                  src={listing.coverImageUrl || CUISINE_PHOTO[listing.cuisineType] || CUISINE_PHOTO.OTHER}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 py-3 opacity-60">
                <p className="text-sm font-medium text-stone-700 truncate">{listing.title}</p>
                <p className="text-xs text-stone-400">
                  {new Date(listing.dinnerDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}{listing.city}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 pr-4">
                <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium opacity-60 ${STATUS_STYLE[listing.status] ?? ""}`}>
                  {listing.status}
                </span>
                <Link
                  href={`/host/new?from=${listing.id}`}
                  className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 transition whitespace-nowrap"
                >
                  Run again →
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
