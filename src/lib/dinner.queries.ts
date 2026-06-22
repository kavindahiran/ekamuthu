import { prisma } from "./prisma";

// The shape of a dinner returned by getActiveDinners.
// Using ReturnType so it always stays in sync with the query — no manual maintenance.
export type DinnerWithHost = Awaited<ReturnType<typeof getActiveDinners>>[number];

export interface DinnerFilters {
  city?: string;
  dietaryTag?: string;   // single tag from URL param
}

export async function getActiveDinners(filters: DinnerFilters = {}) {
  return prisma.dinnerListing.findMany({
    where: {
      status: "ACTIVE",
      seatsAvailable: { gt: 0 },
      dinnerDate: { gte: new Date() },                // only upcoming dinners
      ...(filters.city && { city: filters.city }),
      ...(filters.dietaryTag && {
        dietaryTags: { has: filters.dietaryTag as any }, // GIN index serves this
      }),
    },
    select: {
      id: true,
      title: true,
      cuisineType: true,
      dietaryTags: true,
      dinnerDate: true,
      area: true,
      city: true,
      seatsAvailable: true,
      totalSeats: true,
      pricePerSeatLKR: true,
      coverImageUrl: true,
      host: {
        select: {
          name: true,
          displayName: true,
          avatarUrl: true,
          avgRatingAsHost: true,
          totalReviewsAsHost: true,
        },
      },
    },
    orderBy: { dinnerDate: "asc" },
    take: 24,
  });
}

export type DinnerDetail = Awaited<ReturnType<typeof getDinnerDetail>>;

export async function getDinnerDetail(id: string) {
  return prisma.dinnerListing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      cuisineType: true,
      menuItems: true,
      coverImageUrl: true,
      imageUrls: true,
      dietaryTags: true,
      dietaryNotes: true,
      totalSeats: true,
      seatsAvailable: true,
      pricePerSeatLKR: true,
      dinnerDate: true,
      doorOpenTime: true,
      endTime: true,
      area: true,
      city: true,
      status: true,
      genderPolicy: true,
      minimumAge: true,
      maxSeatsPerBooking: true,
      cancellationPolicy: true,
      hostId: true,
      host: {
        select: {
          id: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          avgRatingAsHost: true,
          totalReviewsAsHost: true,
          hostSince: true,
        },
      },
      // Approved/paid guests — first name + avatar only for privacy
      bookings: {
        where: { status: { in: ["APPROVED", "PAID"] } },
        select: {
          id: true,
          status: true,
          seatsRequested: true,
          guest: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      // Pre-dinner Q&A board
      questions: {
        orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          body: true,
          replyBody: true,
          repliedAt: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      // Public guest reviews
      reviews: {
        where: { isPublic: true, type: "GUEST_REVIEWS_HOST" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: {
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

export async function getGuestBookingForListing(
  guestId: string,
  listingId: string
) {
  return prisma.booking.findUnique({
    where: { guestId_listingId: { guestId, listingId } },
    select: { id: true, status: true, introMessage: true },
  });
}

// Used to populate the city filter dropdown
export async function getActiveCities(): Promise<string[]> {
  const result = await prisma.dinnerListing.findMany({
    where: { status: "ACTIVE", dinnerDate: { gte: new Date() } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return result.map((r) => r.city);
}
