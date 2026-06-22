"use client";

import { useState } from "react";

const LABELS = ["Terrible", "Poor", "OK", "Good", "Excellent"];

interface Props {
  name?: string;
  initialValue?: number;
}

export function StarRatingPicker({ name = "rating", initialValue = 0 }: Props) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(initialValue);

  const active = hovered || selected;

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => setSelected(star)}
            className="text-4xl transition-transform hover:scale-110 focus:outline-none cursor-pointer leading-none"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <span className={star <= active ? "text-amber-400" : "text-stone-200"}>★</span>
          </button>
        ))}
      </div>
      {active > 0 && (
        <p className="mt-1 text-sm text-stone-600 font-medium">{LABELS[active - 1]}</p>
      )}
    </div>
  );
}
