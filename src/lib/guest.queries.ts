import { prisma } from "./prisma";

export type GuestBooking = Awaited<ReturnType<typeof getGuestBookings>>[number];

export async function getGuestBookings(guestId: string) {
  return prisma.booking.findMany({
    where: { guestId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      introMessage: true,
      seatsRequested: true,
      createdAt: true,
      respondedAt: true,
      listing: {
        select: {
          id: true,
          title: true,
          dinnerDate: true,
          area: true,
          city: true,
          pricePerSeatLKR: true,
          cuisineType: true,
          status: true,
          host: {
            select: {
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      payment: {
        select: { id: true, status: true, amountLKR: true },
      },
      reviews: {
        where: { reviewerId: guestId },
        select: { id: true },
      },
    },
  });
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bio: true,
      phone: true,
      phoneVerified: true,
      idVerificationStatus: true,
      isHostEligible: true,
      role: true,
      dietaryPreferences: true,
      instagramUrl: true,
      linkedinUrl: true,
      facebookUrl: true,
      avgRatingAsGuest: true,
      avgRatingAsHost: true,
      totalReviewsAsGuest: true,
      totalReviewsAsHost: true,
      hostSince: true,
      createdAt: true,
    },
  });
}
