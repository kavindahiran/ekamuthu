import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      {/* Full-bleed food photography background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1920&q=80')",
        }}
        aria-hidden
      />
      {/* Dark overlay — enough to keep text readable */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" aria-hidden />

      {/* Brand mark — above card */}
      <div className="relative z-10 mb-6 text-center">
        <Link href="/" className="inline-block">
          <span className="font-display text-3xl font-bold text-white tracking-tight">
            Ekamuthu
          </span>
          <span className="block text-lg font-medium text-amber-400 tracking-widest mt-0.5">
            එකමුතු
          </span>
        </Link>
        <p className="mt-1 text-sm text-white/70">
          Share a home-cooked meal with strangers
        </p>
      </div>

      {/* Card — frosted glass effect on the dark background */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl shadow-xl border border-white/10 overflow-hidden"
           style={{ background: "rgba(255,251,240,0.97)" }}>
        <div className="px-8 py-8">
          {children}
        </div>
      </div>

      {/* Footer tagline */}
      <p className="relative z-10 mt-6 text-xs text-white/40 text-center">
        ID-verified hosts · Real home kitchens · Across Sri Lanka
      </p>
    </div>
  );
}
