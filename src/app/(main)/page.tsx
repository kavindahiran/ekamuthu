import { Suspense } from "react";
import Link from "next/link";
import { getActiveDinners, getActiveCities } from "@/lib/dinner.queries";
import { DinnerCard } from "@/components/dinner/DinnerCard";
import { DinnerFilters } from "@/components/dinner/DinnerFilters";

interface Props {
  searchParams: Promise<{ city?: string; diet?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const isFiltered = params.city || params.diet;

  const [dinners, cities] = await Promise.all([
    getActiveDinners({ city: params.city, dietaryTag: params.diet }),
    getActiveCities(),
  ]);

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      {!isFiltered && (
        <section className="relative -mx-4 sm:-mx-6 mb-12 overflow-hidden" style={{ minHeight: 540 }}>
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80')",
            }}
          />
          {/* Layered overlay: dark at top & bottom, slightly lighter in centre */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/75" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
            <span className="inline-block mb-4 rounded-full border border-amber-400/60 bg-amber-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
              Sri Lanka's Home Dining Community
            </span>

            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white leading-tight max-w-3xl">
              Share a home-cooked meal<br className="hidden sm:block" /> with strangers
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg text-white/75 leading-relaxed">
              Join intimate dinners hosted by locals in their homes across Colombo, Kandy, Galle, Jaffna and beyond.
              Every table is someone's home.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <a
                href="#dinners"
                className="rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-3 text-sm transition shadow-lg shadow-amber-900/30"
              >
                Browse Tables
              </a>
              <Link
                href="/register"
                className="rounded-full border border-white/40 hover:bg-white/10 text-white font-medium px-8 py-3 text-sm transition backdrop-blur-sm"
              >
                Become a host
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/60 text-xs">
              <span>🔒 ID-verified hosts</span>
              <span>🍽️ Real home kitchens</span>
              <span>📍 Across Sri Lanka</span>
              <span>💳 Secure payments</span>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works strip ───────────────────────────────────── */}
      {!isFiltered && (
        <section className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🔍", title: "Browse & filter", body: "Find dinners by city, cuisine, or dietary requirement." },
            { icon: "✉️", title: "Send a request", body: "Introduce yourself. The host reviews and approves guests." },
            { icon: "🎟️", title: "Pay & attend", body: "Secure your seat after approval. Enjoy the meal." },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-amber-100 bg-white px-6 py-5 flex items-start gap-4 shadow-sm">
              <span className="text-2xl flex-shrink-0">{step.icon}</span>
              <div>
                <p className="font-semibold text-stone-900 text-sm">{step.title}</p>
                <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Filters + listings ──────────────────────────────────── */}
      <section id="dinners">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-2xl font-bold text-stone-900">
            {isFiltered ? "Filtered Dinners" : "Available Tables"}
          </h2>
          {isFiltered && (
            <Link href="/" className="text-sm text-amber-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-full bg-amber-50" />}>
          <DinnerFilters cities={cities} totalCount={dinners.length} />
        </Suspense>
      </section>

      {/* ── Dinner grid ─────────────────────────────────────────── */}
      <div className="mt-6">
        {dinners.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-display text-xl font-semibold text-stone-700">No dinners found</p>
            <p className="text-sm text-stone-400 mt-2">Try adjusting your filters or check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dinners.map((dinner) => (
              <DinnerCard key={dinner.id} dinner={dinner as any} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
