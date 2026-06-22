"use client";

// Client Component: handles the filter UI.
// When the user changes a filter, it updates the URL → the Server Component
// re-fetches with the new filters. No API call needed.

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const DIETARY_OPTIONS = [
  { value: "",                  label: "All Dietary" },
  { value: "HALAL",             label: "Halal" },
  { value: "NO_BEEF",           label: "No Beef" },
  { value: "NO_PORK",           label: "No Pork" },
  { value: "STRICT_BUDDHIST_VEG", label: "Buddhist Veg" },
  { value: "HINDU_VEG",         label: "Hindu Veg" },
  { value: "VEGAN",             label: "Vegan" },
  { value: "LACTO_VEGETARIAN",  label: "Lacto Veg" },
];

interface Props {
  cities: string[];
  totalCount: number;
}

export function DinnerFilters({ cities, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCity = searchParams.get("city") ?? "";
  const currentDiet = searchParams.get("diet") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* City filter */}
      <select
        value={currentCity}
        onChange={(e) => updateFilter("city", e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
      >
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>

      {/* Dietary filter */}
      <select
        value={currentDiet}
        onChange={(e) => updateFilter("diet", e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
      >
        {DIETARY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Result count + loading indicator */}
      <span className={`text-sm text-stone-400 transition-opacity ${isPending ? "opacity-40" : ""}`}>
        {totalCount === 0 ? "No dinners found" : `${totalCount} dinner${totalCount !== 1 ? "s" : ""}`}
      </span>
    </div>
  );
}
