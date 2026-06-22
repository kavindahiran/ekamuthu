"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ListingActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function createListingAction(
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!session.user.isHostEligible) redirect("/");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const cuisineType = formData.get("cuisineType") as string;
  const coverImageUrl = (formData.get("coverImageUrl") as string)?.trim() || null;
  const dietaryTags = formData.getAll("dietaryTags") as string[];
  const menuItemsRaw = formData.getAll("menuItems") as string[];
  const menuItems = menuItemsRaw.map((s) => s.trim()).filter(Boolean);
  const dietaryNotes = (formData.get("dietaryNotes") as string)?.trim() || null;
  const area = (formData.get("area") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const totalSeats = parseInt(formData.get("totalSeats") as string, 10);
  const pricePerSeatLKR = parseFloat(formData.get("pricePerSeatLKR") as string);
  const maxSeatsPerBooking = parseInt(formData.get("maxSeatsPerBooking") as string, 10);
  const genderPolicy = (formData.get("genderPolicy") as string) || "NONE";
  const minimumAge = formData.get("minimumAge") ? parseInt(formData.get("minimumAge") as string, 10) : null;
  const cancellationPolicy = (formData.get("cancellationPolicy") as string)?.trim() || null;

  // Date/time: the form sends a datetime-local string for dinner date
  const dinnerDateRaw = formData.get("dinnerDate") as string;
  const doorOpenTimeRaw = formData.get("doorOpenTime") as string;
  const endTimeRaw = formData.get("endTime") as string;

  // Validate
  const errors: Record<string, string> = {};
  if (!title || title.length < 3) errors.title = "Title must be at least 3 characters.";
  if (title && title.length > 100) errors.title = "Title must be 100 characters or fewer.";
  if (!description || description.length < 20) errors.description = "Description must be at least 20 characters.";
  if (!cuisineType) errors.cuisineType = "Please select a cuisine type.";
  if (menuItems.length === 0) errors.menuItems = "Add at least one menu item.";
  if (!area) errors.area = "Area is required.";
  if (!city) errors.city = "City is required.";
  if (!totalSeats || totalSeats < 2 || totalSeats > 5) errors.totalSeats = "Total seats must be between 2 and 5.";
  if (!pricePerSeatLKR || pricePerSeatLKR < 500) errors.pricePerSeatLKR = "Price must be at least LKR 500.";
  if (maxSeatsPerBooking < 1 || maxSeatsPerBooking > totalSeats) errors.maxSeatsPerBooking = "Invalid max seats per booking.";
  if (!dinnerDateRaw) errors.dinnerDate = "Dinner date and time is required.";

  const dinnerDate = dinnerDateRaw ? new Date(dinnerDateRaw) : null;
  if (dinnerDate && dinnerDate <= new Date()) errors.dinnerDate = "Dinner must be scheduled in the future.";

  // Parse door open and end times — combine with the dinner date's date part
  let doorOpenTime: Date | null = null;
  let endTime: Date | null = null;
  if (dinnerDate && doorOpenTimeRaw) {
    const [dh, dm] = doorOpenTimeRaw.split(":").map(Number);
    doorOpenTime = new Date(dinnerDate);
    doorOpenTime.setHours(dh, dm, 0, 0);
  }
  if (dinnerDate && endTimeRaw) {
    const [eh, em] = endTimeRaw.split(":").map(Number);
    endTime = new Date(dinnerDate);
    endTime.setHours(eh, em, 0, 0);
  }
  if (!doorOpenTimeRaw) errors.doorOpenTime = "Door open time is required.";
  if (!endTimeRaw) errors.endTime = "End time is required.";

  if (Object.keys(errors).length > 0) return { fieldErrors: errors };

  try {
    const listing = await prisma.dinnerListing.create({
      data: {
        hostId: session.user.id,
        title,
        description,
        cuisineType: cuisineType as any,
        dietaryTags: dietaryTags as any[],
        menuItems,
        dietaryNotes,
        area,
        city,
        totalSeats,
        seatsAvailable: totalSeats,
        pricePerSeatLKR,
        maxSeatsPerBooking,
        genderPolicy: genderPolicy as any,
        minimumAge,
        cancellationPolicy,
        coverImageUrl,
        dinnerDate: dinnerDate!,
        doorOpenTime: doorOpenTime ?? dinnerDate!,
        endTime: endTime ?? dinnerDate!,
        status: "ACTIVE",
      },
    });

    redirect(`/dinners/${listing.id}`);
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[createListingAction]", err);
    return { error: "Failed to create listing. Please try again." };
  }
}

export async function updateListingAction(
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!session.user.isHostEligible) redirect("/");

  const listingId = (formData.get("listingId") as string)?.trim();
  if (!listingId) return { error: "Missing listing ID." };

  // Verify ownership
  const existing = await prisma.dinnerListing.findFirst({
    where: { id: listingId, hostId: session.user.id },
    select: { id: true, totalSeats: true, seatsAvailable: true, status: true },
  });
  if (!existing) return { error: "Listing not found or access denied." };
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    return { error: "This listing can no longer be edited." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const cuisineType = formData.get("cuisineType") as string;
  const coverImageUrl = (formData.get("coverImageUrl") as string)?.trim() || null;
  const dietaryTags = formData.getAll("dietaryTags") as string[];
  const menuItemsRaw = formData.getAll("menuItems") as string[];
  const menuItems = menuItemsRaw.map((s) => s.trim()).filter(Boolean);
  const dietaryNotes = (formData.get("dietaryNotes") as string)?.trim() || null;
  const area = (formData.get("area") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const totalSeats = parseInt(formData.get("totalSeats") as string, 10);
  const pricePerSeatLKR = parseFloat(formData.get("pricePerSeatLKR") as string);
  const maxSeatsPerBooking = parseInt(formData.get("maxSeatsPerBooking") as string, 10);
  const genderPolicy = (formData.get("genderPolicy") as string) || "NONE";
  const minimumAge = formData.get("minimumAge") ? parseInt(formData.get("minimumAge") as string, 10) : null;
  const cancellationPolicy = (formData.get("cancellationPolicy") as string)?.trim() || null;

  const dinnerDateRaw = formData.get("dinnerDate") as string;
  const doorOpenTimeRaw = formData.get("doorOpenTime") as string;
  const endTimeRaw = formData.get("endTime") as string;

  const errors: Record<string, string> = {};
  if (!title || title.length < 3) errors.title = "Title must be at least 3 characters.";
  if (title && title.length > 100) errors.title = "Title must be 100 characters or fewer.";
  if (!description || description.length < 20) errors.description = "Description must be at least 20 characters.";
  if (!cuisineType) errors.cuisineType = "Please select a cuisine type.";
  if (menuItems.length === 0) errors.menuItems = "Add at least one menu item.";
  if (!area) errors.area = "Area is required.";
  if (!city) errors.city = "City is required.";
  if (!dinnerDateRaw) errors.dinnerDate = "Dinner date and time is required.";
  if (!pricePerSeatLKR || pricePerSeatLKR < 500) errors.pricePerSeatLKR = "Price must be at least LKR 500.";
  if (!doorOpenTimeRaw) errors.doorOpenTime = "Door open time is required.";
  if (!endTimeRaw) errors.endTime = "End time is required.";

  // Seats: can't go below number already booked
  const bookedSeats = existing.totalSeats - existing.seatsAvailable;
  if (!totalSeats || totalSeats < 2 || totalSeats > 5) {
    errors.totalSeats = "Total seats must be between 2 and 5.";
  } else if (totalSeats < bookedSeats) {
    errors.totalSeats = `Can't reduce below ${bookedSeats} — that many seats are already booked.`;
  }
  if (maxSeatsPerBooking < 1 || maxSeatsPerBooking > totalSeats) {
    errors.maxSeatsPerBooking = "Invalid max seats per booking.";
  }

  const dinnerDate = dinnerDateRaw ? new Date(dinnerDateRaw) : null;

  let doorOpenTime: Date | null = null;
  let endTime: Date | null = null;
  if (dinnerDate && doorOpenTimeRaw) {
    const [dh, dm] = doorOpenTimeRaw.split(":").map(Number);
    doorOpenTime = new Date(dinnerDate);
    doorOpenTime.setHours(dh, dm, 0, 0);
  }
  if (dinnerDate && endTimeRaw) {
    const [eh, em] = endTimeRaw.split(":").map(Number);
    endTime = new Date(dinnerDate);
    endTime.setHours(eh, em, 0, 0);
  }

  if (Object.keys(errors).length > 0) return { fieldErrors: errors };

  // Recalculate seatsAvailable when totalSeats changes
  const newSeatsAvailable = totalSeats - bookedSeats;

  try {
    await prisma.dinnerListing.update({
      where: { id: listingId },
      data: {
        title,
        description,
        cuisineType: cuisineType as any,
        coverImageUrl,
        dietaryTags: dietaryTags as any[],
        menuItems,
        dietaryNotes,
        area,
        city,
        totalSeats,
        seatsAvailable: newSeatsAvailable,
        // Re-open if it was FULL and now has seats again
        status: existing.status === "FULL" && newSeatsAvailable > 0 ? "ACTIVE" : existing.status,
        pricePerSeatLKR,
        maxSeatsPerBooking,
        genderPolicy: genderPolicy as any,
        minimumAge,
        cancellationPolicy,
        dinnerDate: dinnerDate!,
        doorOpenTime: doorOpenTime ?? dinnerDate!,
        endTime: endTime ?? dinnerDate!,
      },
    });

    revalidatePath("/host/dashboard");
    revalidatePath(`/dinners/${listingId}`);
    redirect(`/dinners/${listingId}`);
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[updateListingAction]", err);
    return { error: "Failed to save changes. Please try again." };
  }
}
