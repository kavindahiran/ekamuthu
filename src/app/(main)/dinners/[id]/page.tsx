import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDinnerDetail, getGuestBookingForListing } from "@/lib/dinner.queries";
import { DietaryBadge } from "@/components/dinner/DietaryBadge";
import { BookingForm } from "@/components/booking/BookingForm";
import { QuestionBoard } from "@/components/dinner/QuestionBoard";

const CUISINE_PHOTO: Record<string, string> = {
  SRI_LANKAN:     "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80",
  SOUTH_INDIAN:   "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=1200&q=80",
  NORTH_INDIAN:   "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
  CHINESE:        "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
  WESTERN:        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  MIDDLE_EASTERN: "https://images.unsplash.com/photo-1544250634-b6384927a14d?auto=format&fit=crop&w=1200&q=80",
  FUSION:         "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80",
  OTHER:          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
};

interface Props {
  params: Promise<{ id: string }>;
}

const BOOKING_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "⏳ Awaiting host review",        color: "amber" },
  APPROVED: { label: "✅ Approved — awaiting payment",  color: "emerald" },
  REJECTED: { label: "❌ Host declined this request",   color: "red" },
  PAID:     { label: "🎟️ Seat secured",                color: "emerald" },
  CANCELLED:{ label: "↩️ Cancelled",                   color: "stone" },
};

export default async function DinnerDetailPage({ params }: Props) {
  const { id } = await params;
  const [dinner, session] = await Promise.all([
    getDinnerDetail(id),
    auth(),
  ]);

  if (!dinner || dinner.status === "CANCELLED") notFound();

  const existingBooking = session?.user?.id
    ? await getGuestBookingForListing(session.user.id, dinner.id)
    : null;

  const hostName = dinner.host.displayName ?? dinner.host.name;
  const date = new Date(dinner.dinnerDate);
  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });
  const endStr = new Date(dinner.endTime).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });
  const price = Number(dinner.pricePerSeatLKR).toLocaleString("en-LK");

  const isFull = dinner.seatsAvailable === 0;
  const isPast = date < new Date();
  const canBook = !isFull && !isPast && dinner.status === "ACTIVE";

  // Attending guests: approved + paid bookings (anonymised to first name)
  const attendingGuests = dinner.bookings.map((b) => ({
    id: b.guest.id,
    firstName: (b.guest.displayName ?? b.guest.name).split(" ")[0],
    avatarUrl: b.guest.avatarUrl,
    seats: b.seatsRequested,
    paid: b.status === "PAID",
  }));

  const confirmedCount = dinner.totalSeats - dinner.seatsAvailable;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition">
        ← Back to dinners
      </Link>

      {/* ── Cover + header ────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
        <div className="h-56 sm:h-80 relative">
          <img
            src={dinner.coverImageUrl || CUISINE_PHOTO[dinner.cuisineType] || CUISINE_PHOTO.OTHER}
            alt={dinner.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {isFull && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-white font-semibold text-xl">This dinner is full</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(dinner.dietaryTags as any[]).map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">{dinner.title}</h1>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">📅</span>
              <div>
                <p className="font-medium text-stone-800">{dateStr}</p>
                <p className="text-stone-500">{timeStr} – {endStr}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-lg">📍</span>
              <div>
                <p className="font-medium text-stone-800">{dinner.area}</p>
                <p className="text-stone-500">{dinner.city}</p>
                <p className="text-xs text-stone-400 mt-0.5">Exact address after approval</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-lg">🪑</span>
              <div>
                <p className="font-medium text-stone-800">LKR {price} / seat</p>
                <p className="text-stone-500">{dinner.seatsAvailable} of {dinner.totalSeats} seats left</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: details ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <section>
            <h2 className="text-base font-semibold text-stone-900 mb-2">About this dinner</h2>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{dinner.description}</p>
          </section>

          {/* Menu */}
          {dinner.menuItems.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-stone-900 mb-2">Menu</h2>
              <ul className="space-y-1">
                {dinner.menuItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Dietary notes */}
          {dinner.dietaryNotes && (
            <section>
              <h2 className="text-base font-semibold text-stone-900 mb-2">Dietary notes</h2>
              <p className="text-sm text-stone-600 leading-relaxed">{dinner.dietaryNotes}</p>
            </section>
          )}

          {/* ── Who's coming ─────────────────────────────────────── */}
          {attendingGuests.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-stone-900 mb-1">Who&apos;s coming</h2>
              <p className="text-sm text-stone-500 mb-4">
                {confirmedCount} of {dinner.totalSeats} seat{dinner.totalSeats !== 1 ? "s" : ""} filled
              </p>

              {/* Seat fill bar */}
              <div className="h-2 rounded-full bg-stone-100 mb-5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${(confirmedCount / dinner.totalSeats) * 100}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                {attendingGuests.map((g) => (
                  <div key={g.id} className="flex flex-col items-center gap-1.5">
                    {g.avatarUrl ? (
                      <img src={g.avatarUrl} alt={g.firstName} className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-amber-100 ring-2 ring-white shadow flex items-center justify-center text-amber-700 font-semibold text-sm">
                        {g.firstName[0]}
                      </div>
                    )}
                    <span className="text-xs text-stone-600 font-medium">{g.firstName}</span>
                    {g.paid && <span className="text-[10px] text-emerald-600 font-semibold">Confirmed</span>}
                  </div>
                ))}

                {/* Empty seat placeholders */}
                {Array.from({ length: dinner.seatsAvailable }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5">
                    <div className="h-12 w-12 rounded-full border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 text-xl">
                      ?
                    </div>
                    <span className="text-xs text-stone-300">Open</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Cancellation policy ──────────────────────────────── */}
          <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 space-y-3">
            <h2 className="text-base font-semibold text-stone-900">Cancellation policy</h2>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg mt-0.5">✅</span>
              <div>
                <p className="font-medium text-stone-800">Free cancellation within 24 hours</p>
                <p className="text-stone-500 text-xs mt-0.5">
                  Cancel within 24 hours of your booking being approved for a full refund, no questions asked.
                </p>
              </div>
            </div>
            {dinner.cancellationPolicy && (
              <div className="flex items-start gap-3 text-sm border-t border-emerald-100 pt-3">
                <span className="text-lg mt-0.5">📋</span>
                <p className="text-stone-600 leading-relaxed">{dinner.cancellationPolicy}</p>
              </div>
            )}
          </section>

          {/* House rules */}
          <section>
            <h2 className="text-base font-semibold text-stone-900 mb-2">Details</h2>
            <div className="space-y-1.5 text-sm text-stone-600">
              {dinner.genderPolicy !== "NONE" && (
                <p>👥 {dinner.genderPolicy === "FEMALE_ONLY" ? "Female guests only" : "Male guests only"}</p>
              )}
              {dinner.minimumAge && <p>🔞 Minimum age: {dinner.minimumAge}+</p>}
              <p>🪑 Max {dinner.maxSeatsPerBooking} seat{dinner.maxSeatsPerBooking > 1 ? "s" : ""} per booking</p>
              {dinner.doorOpenTime && (
                <p>🚪 Doors open at {new Date(dinner.doorOpenTime).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
              )}
            </div>
          </section>

          {/* Host */}
          <section className="rounded-xl border border-stone-100 bg-stone-50 p-5">
            <h2 className="text-base font-semibold text-stone-900 mb-3">Your host</h2>
            <div className="flex items-start gap-4">
              {dinner.host.avatarUrl ? (
                <img src={dinner.host.avatarUrl} alt={hostName} className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-semibold flex-shrink-0">
                  {hostName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{hostName}</p>
                {dinner.host.totalReviewsAsHost > 0 && (
                  <p className="text-sm text-stone-500">
                    ⭐ {dinner.host.avgRatingAsHost.toFixed(1)} · {dinner.host.totalReviewsAsHost} review{dinner.host.totalReviewsAsHost !== 1 ? "s" : ""}
                  </p>
                )}
                {dinner.host.hostSince && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    Hosting since {new Date(dinner.host.hostSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </p>
                )}
                {dinner.host.bio && (
                  <p className="mt-2 text-sm text-stone-600 leading-relaxed line-clamp-3">{dinner.host.bio}</p>
                )}
              </div>
            </div>
          </section>

          {/* ── Guest Reviews ────────────────────────────────── */}
          {dinner.reviews.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-stone-900 mb-1">Guest reviews</h2>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-amber-400 font-bold">
                  {"★".repeat(Math.round(dinner.host.avgRatingAsHost))}{"☆".repeat(5 - Math.round(dinner.host.avgRatingAsHost))}
                </span>
                <span className="text-sm font-semibold text-stone-800">
                  {dinner.host.avgRatingAsHost.toFixed(1)}
                </span>
                <span className="text-sm text-stone-400">
                  · {dinner.reviews.length} review{dinner.reviews.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-4">
                {dinner.reviews.map((review) => {
                  const reviewerName = review.reviewer.displayName ?? review.reviewer.name;
                  return (
                    <div key={review.id} className="rounded-xl border border-stone-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        {review.reviewer.avatarUrl ? (
                          <img src={review.reviewer.avatarUrl} alt={reviewerName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                            {reviewerName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-stone-900">{reviewerName}</span>
                            <span className="text-amber-400 text-xs">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                            <span className="text-xs text-stone-400">
                              {new Date(review.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Evening Q&A ─────────────────────────────────────── */}
          <QuestionBoard
            listingId={dinner.id}
            hostId={dinner.hostId}
            questions={dinner.questions as any}
            currentUserId={session?.user?.id ?? null}
          />

        </div>

        {/* ── Right: booking panel ───────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-stone-100 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-stone-900">LKR {price}</span>
              <span className="text-sm text-stone-500">per seat</span>
            </div>

            <div className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${
              isFull || isPast ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-700"
            }`}>
              {isPast ? "This dinner has passed" : isFull ? "Fully booked" : `${dinner.seatsAvailable} seat${dinner.seatsAvailable !== 1 ? "s" : ""} available`}
            </div>

            {/* Booking state machine */}
            {!canBook ? null : existingBooking ? (
              <ExistingBookingBanner status={existingBooking.status} />
            ) : !session ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-stone-500">Sign in to request a seat</p>
                <Link
                  href={`/signin?callbackUrl=/dinners/${dinner.id}`}
                  className="block w-full rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm py-3 transition text-center"
                >
                  Sign in to book
                </Link>
                <Link href="/register" className="block text-sm text-amber-600 hover:underline">
                  No account? Register free
                </Link>
              </div>
            ) : (
              <BookingForm listingId={dinner.id} maxSeats={dinner.maxSeatsPerBooking} />
            )}

            {/* Free cancellation trust badge */}
            {canBook && (
              <div className="flex items-center gap-2 text-xs text-stone-500 pt-1 border-t border-stone-100">
                <span className="text-emerald-500">✓</span>
                Free cancellation within 24 hours
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function ExistingBookingBanner({ status }: { status: string }) {
  const info = BOOKING_STATUS_LABEL[status] ?? { label: status, color: "stone" };
  const colorMap: Record<string, string> = {
    amber:   "bg-amber-50 border-amber-200 text-amber-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    red:     "bg-red-50 border-red-200 text-red-800",
    stone:   "bg-stone-50 border-stone-200 text-stone-600",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm text-center font-medium ${colorMap[info.color]}`}>
      {info.label}
    </div>
  );
}
