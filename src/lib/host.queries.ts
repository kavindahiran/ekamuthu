import { prisma } from "./prisma";

export type HostDashboardListing = Awaited<ReturnType<typeof getHostDashboard>>[number];
export type ListingForEdit = Awaited<ReturnType<typeof getListingForEdit>>;

// Decimal can't cross the Server→Client boundary — convert before passing as props
export type SerializedListingForEdit = Omit<NonNullable<ListingForEdit>, "pricePerSeatLKR"> & {
  pricePerSeatLKR: number;
};

export function serializeListingForClient(
  listing: NonNullable<ListingForEdit>
): SerializedListingForEdit {
  return { ...listing, pricePerSeatLKR: Number(listing.pricePerSeatLKR) };
}

export async function getListingForEdit(id: string, hostId: string) {
  return prisma.dinnerListing.findFirst({
    where: { id, hostId },
    select: {
      id: true,
      title: true,
      description: true,
      cuisineType: true,
      coverImageUrl: true,
      menuItems: true,
      dietaryTags: true,
      dietaryNotes: true,
      dinnerDate: true,
      doorOpenTime: true,
      endTime: true,
      area: true,
      city: true,
      totalSeats: true,
      seatsAvailable: true,
      pricePerSeatLKR: true,
      maxSeatsPerBooking: true,
      genderPolicy: true,
      minimumAge: true,
      cancellationPolicy: true,
      status: true,
    },
  });
}

export async function getHostDashboard(hostId: string) {
  return prisma.dinnerListing.findMany({
    where: { hostId },
    select: {
      id: true,
      title: true,
      status: true,
      dinnerDate: true,
      seatsAvailable: true,
      totalSeats: true,
      pricePerSeatLKR: true,
      area: true,
      city: true,
      cuisineType: true,
      coverImageUrl: true,
      bookings: {
        where: { status: { in: ["PENDING", "APPROVED", "PAID"] } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          introMessage: true,
          seatsRequested: true,
          createdAt: true,
          guest: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
              avgRatingAsGuest: true,
              totalReviewsAsGuest: true,
            },
          },
        },
      },
    },
    orderBy: { dinnerDate: "asc" },
  });
}
