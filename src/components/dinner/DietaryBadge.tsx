// Visual label for a single dietary tag. Used on listing cards and detail pages.

type DietaryTag =
  | "STRICT_BUDDHIST_VEG" | "HINDU_VEG" | "VEGAN" | "LACTO_VEGETARIAN"
  | "HALAL" | "NO_BEEF" | "NO_PORK" | "REGULAR_NON_VEG"
  | "JAIN" | "GLUTEN_FREE" | "NUT_FREE";

const LABEL: Record<DietaryTag, string> = {
  STRICT_BUDDHIST_VEG: "Buddhist Veg",
  HINDU_VEG:           "Hindu Veg",
  VEGAN:               "Vegan",
  LACTO_VEGETARIAN:    "Lacto Veg",
  HALAL:               "Halal",
  NO_BEEF:             "No Beef",
  NO_PORK:             "No Pork",
  REGULAR_NON_VEG:     "Non-Veg",
  JAIN:                "Jain",
  GLUTEN_FREE:         "Gluten Free",
  NUT_FREE:            "Nut Free",
};

const STYLE: Record<DietaryTag, string> = {
  STRICT_BUDDHIST_VEG: "bg-yellow-100 text-yellow-700",
  HINDU_VEG:           "bg-yellow-100 text-yellow-700",
  VEGAN:               "bg-teal-100 text-teal-700",
  LACTO_VEGETARIAN:    "bg-green-100 text-green-700",
  HALAL:               "bg-emerald-100 text-emerald-700",
  NO_BEEF:             "bg-orange-100 text-orange-700",
  NO_PORK:             "bg-sky-100 text-sky-700",
  REGULAR_NON_VEG:     "bg-rose-100 text-rose-700",
  JAIN:                "bg-lime-100 text-lime-700",
  GLUTEN_FREE:         "bg-purple-100 text-purple-700",
  NUT_FREE:            "bg-violet-100 text-violet-700",
};

export function DietaryBadge({ tag }: { tag: DietaryTag }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[tag]}`}>
      {LABEL[tag]}
    </span>
  );
}
