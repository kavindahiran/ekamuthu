import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "@/components/review/ReviewForm";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function WriteReviewPage({ params }: Props) {
  const { bookingId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/guest/bookings/${bookingId}/review`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestId: true,
      status: true,
      listing: {
        select: {
          id: true,
          title: true,
          dinnerDate: true,
          host: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      reviews: {
        where: { reviewerId: session.user.id },
        select: { id: true },
      },
    },
  });

  if (!booking) notFound();
  if (booking.guestId !== session.user.id) redirect("/guest/bookings");

  // Redirect if already reviewed
  if (booking.reviews.length > 0) {
    redirect("/guest/bookings");
  }

  // Must be paid/attended and dinner date must have passed
  if (!["PAID", "ATTENDED"].includes(booking.status)) {
    redirect("/guest/bookings");
  }
  if (new Date(booking.listing.dinnerDate) > new Date()) {
    redirect("/guest/bookings");
  }

  const hostName = booking.listing.host.displayName ?? booking.listing.host.name;

  return (
    <div className="max-w-xl mx-auto space-y-6">

      <div>
        <Link href="/guest/bookings" className="text-sm text-stone-500 hover:text-stone-700 transition">
          ← My bookings
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-stone-900">Write a review</h1>
        <p className="text-sm text-stone-500 mt-1">Help future guests by sharing your experience</p>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-6">
        <ReviewForm
          bookingId={booking.id}
          hostName={hostName}
          hostAvatarUrl={booking.listing.host.avatarUrl}
          dinnerTitle={booking.listing.title}
        />
      </div>

    </div>
  );
}
