import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getGuestBookings } from "@/lib/guest.queries";

const STATUS_CONFIG: Record<string, { label: string; style: string; description: string }> = {
  PENDING:   { label: "Pending",          style: "bg-amber-100 text-amber-700",   description: "Waiting for host to review your intro" },
  APPROVED:  { label: "Approved",         style: "bg-emerald-100 text-emerald-700", description: "Host approved — payment required to secure seat" },
  REJECTED:  { label: "Declined",         style: "bg-red-100 text-red-600",       description: "Host could not accommodate you this time" },
  PAID:      { label: "Seat Secured",     style: "bg-blue-100 text-blue-700",     description: "Payment confirmed — you're going!" },
  CANCELLED: { label: "Cancelled",        style: "bg-stone-100 text-stone-500",   description: "This booking was cancelled" },
  ATTENDED:  { label: "Attended",         style: "bg-stone-100 text-stone-600",   description: "You attended this dinner" },
  NO_SHOW:   { label: "No Show",          style: "bg-red-100 text-red-500",       description: "You did not attend" },
};

const CUISINE_GRADIENT: Record<string, string> = {
  SRI_LANKAN: "from-orange-400 to-amber-500",
  SOUTH_INDIAN: "from-yellow-400 to-orange-500",
  NORTH_INDIAN: "from-orange-500 to-red-500",
  CHINESE: "from-red-400 to-rose-500",
  WESTERN: "from-blue-400 to-indigo-500",
  MIDDLE_EASTERN: "from-teal-400 to-emerald-500",
  FUSION: "from-purple-400 to-pink-500",
  OTHER: "from-stone-400 to-stone-500",
};

export default async function GuestBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/guest/bookings");

  const bookings = await getGuestBookings(session.user.id);

  const active = bookings.filter((b) =>
    ["PENDING", "APPROVED", "PAID"].includes(b.status)
  );
  const past = bookings.filter((b) =>
    ["REJECTED", "CANCELLED", "ATTENDED", "NO_SHOW"].includes(b.status)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-stone-900">My Bookings</h1>
        <p className="text-sm text-stone-500 mt-1">Track your dinner requests and upcoming seats</p>
      </div>

      {bookings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-200 py-20 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium text-stone-700">No bookings yet</p>
          <p className="text-sm text-stone-400 mt-1 mb-5">Browse dinners and send a request to get started</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-5 py-2.5 transition"
          >
            Browse dinners
          </Link>
        </div>
      )}

      {/* ── Active bookings ───────────────────────────────────────── */}
      {active.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Active</h2>
          {active.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </section>
      )}

      {/* ── Past bookings ─────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Past</h2>
          {past.map((booking) => (
            <BookingCard key={booking.id} booking={booking} muted />
          ))}
        </section>
      )}

    </div>
  );
}

type GuestBookingItem = Awaited<ReturnType<typeof getGuestBookings>>[number];

function BookingCard({
  booking,
  muted = false,
}: {
  booking: GuestBookingItem;
  muted?: boolean;
}) {
  const cfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, style: "bg-stone-100 text-stone-600", description: "" };
  const hostName = booking.listing.host.displayName ?? booking.listing.host.name;
  const date = new Date(booking.listing.dinnerDate);
  const isPast = date < new Date();
  const gradient = CUISINE_GRADIENT[booking.listing.cuisineType] ?? CUISINE_GRADIENT.OTHER;
  const price = Number(booking.listing.pricePerSeatLKR).toLocaleString("en-LK");

  return (
    <div className={`rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden ${muted ? "opacity-70" : ""}`}>
      <div className="flex">
        {/* Color strip */}
        <div className={`w-2 bg-gradient-to-b ${gradient} flex-shrink-0`} />

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <Link
                href={`/dinners/${booking.listing.id}`}
                className="font-semibold text-stone-900 hover:text-amber-700 transition leading-tight"
              >
                {booking.listing.title}
              </Link>
              <p className="text-xs text-stone-500 mt-0.5">
                📅 {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                {" · "}
                📍 {booking.listing.area}, {booking.listing.city}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                Host: {hostName} · LKR {price}/seat
              </p>
            </div>

            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 ${cfg.style}`}>
              {cfg.label}
            </span>
          </div>

          <p className="mt-3 text-xs text-stone-500">{cfg.description}</p>

          {/* Approved CTA */}
          {booking.status === "APPROVED" && (
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={`/guest/pay/${booking.id}`}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 transition"
              >
                Pay to secure seat →
              </Link>
              <span className="text-xs text-stone-400">
                LKR {(Number(booking.listing.pricePerSeatLKR) * booking.seatsRequested).toLocaleString("en-LK")} total
              </span>
            </div>
          )}

          {/* Review CTA — past dinner, paid/attended, not yet reviewed */}
          {(booking.status === "PAID" || booking.status === "ATTENDED") &&
            isPast &&
            booking.reviews.length === 0 && (
              <div className="mt-3">
                <Link
                  href={`/guest/bookings/${booking.id}/review`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-2 hover:bg-amber-100 transition"
                >
                  ⭐ Leave a review
                </Link>
              </div>
            )}

          {/* Already reviewed */}
          {(booking.status === "PAID" || booking.status === "ATTENDED") &&
            isPast &&
            booking.reviews.length > 0 && (
              <p className="mt-2 text-xs text-stone-400">✓ Review submitted</p>
            )}

          {/* Requested */}
          <p className="mt-2 text-xs text-stone-400">
            Requested {formatTimeAgo(new Date(booking.createdAt))}
            {booking.respondedAt && ` · Host responded ${formatTimeAgo(new Date(booking.respondedAt))}`}
          </p>
        </div>
      </div>
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
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
