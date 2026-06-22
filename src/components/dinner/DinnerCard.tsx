import Link from "next/link";
import { DietaryBadge } from "./DietaryBadge";

// Default Unsplash covers per cuisine — shown when the host hasn't set a custom image
const CUISINE_PHOTO: Record<string, string> = {
  SRI_LANKAN:     "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=75",
  SOUTH_INDIAN:   "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=75",
  NORTH_INDIAN:   "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=75",
  CHINESE:        "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=75",
  WESTERN:        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=75",
  MIDDLE_EASTERN: "https://images.unsplash.com/photo-1544250634-b6384927a14d?w=600&q=75",
  FUSION:         "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=75",
  OTHER:          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=75",
};

const CUISINE_LABEL: Record<string, string> = {
  SRI_LANKAN: "Sri Lankan", SOUTH_INDIAN: "South Indian",
  NORTH_INDIAN: "North Indian", CHINESE: "Chinese",
  WESTERN: "Western", MIDDLE_EASTERN: "Middle Eastern",
  FUSION: "Fusion", OTHER: "Other",
};

interface Host {
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  avgRatingAsHost: number;
  totalReviewsAsHost: number;
}

interface Dinner {
  id: string;
  title: string;
  cuisineType: string;
  dietaryTags: string[];
  dinnerDate: Date;
  area: string;
  city: string;
  seatsAvailable: number;
  totalSeats: number;
  pricePerSeatLKR: unknown;
  coverImageUrl?: string | null;
  host: Host;
}

export function DinnerCard({ dinner }: { dinner: Dinner }) {
  const hostName = dinner.host.displayName ?? dinner.host.name;
  const coverImage = dinner.coverImageUrl || CUISINE_PHOTO[dinner.cuisineType] || CUISINE_PHOTO.OTHER;

  const date = new Date(dinner.dinnerDate);
  const dateStr = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });
  const price = Number(dinner.pricePerSeatLKR).toLocaleString("en-LK");

  const visibleTags = dinner.dietaryTags.slice(0, 2) as any[];
  const extraCount = dinner.dietaryTags.length - visibleTags.length;

  const seatsLeft = dinner.seatsAvailable;
  const isFull = seatsLeft === 0;

  return (
    <Link
      href={`/dinners/${dinner.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-stone-100">
        <img
          src={coverImage}
          alt={dinner.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Cuisine label — bottom left */}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
          {CUISINE_LABEL[dinner.cuisineType] ?? "Other"}
        </span>

        {/* Full badge */}
        {isFull && (
          <span className="absolute top-3 right-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            Full
          </span>
        )}

        {/* Seats left — warm indicator */}
        {!isFull && seatsLeft <= 2 && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            {seatsLeft} left
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">

        {/* Dietary tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-500">
                +{extraCount}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-stone-900 text-sm leading-snug group-hover:text-amber-700 transition-colors line-clamp-2">
          {dinner.title}
        </h3>

        {/* Date & Location */}
        <div className="space-y-0.5 text-xs text-stone-500">
          <p>📅 {dateStr} · {timeStr}</p>
          <p>📍 {dinner.area}, {dinner.city}</p>
        </div>

        <div className="flex-1" />

        {/* Divider */}
        <div className="border-t border-stone-100" />

        {/* Host + price */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            {dinner.host.avatarUrl ? (
              <img src={dinner.host.avatarUrl} alt={hostName} className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-semibold flex-shrink-0">
                {hostName[0]}
              </div>
            )}
            <span className="text-xs text-stone-500 truncate">{hostName}</span>
            {dinner.host.totalReviewsAsHost > 0 && (
              <span className="text-xs text-amber-600 flex-shrink-0 font-medium">
                ⭐ {dinner.host.avgRatingAsHost.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-stone-900">LKR {price}</p>
            <p className={`text-xs ${isFull ? "text-red-500" : "text-stone-400"}`}>
              {isFull ? "Fully booked" : `${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} left`}
            </p>
          </div>
        </div>

      </div>
    </Link>
  );
}
