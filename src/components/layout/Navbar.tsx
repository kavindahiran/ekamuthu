import Link from "next/link";
import { auth } from "@/lib/auth";
import { UserMenu } from "./UserMenu";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-100/80 bg-[#FFFBF0]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-stone-900 tracking-tight">
            Ekamuthu
          </span>
          <span className="text-sm font-medium text-amber-600 tracking-wide">එකමුතු</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.isHostEligible && (
                <Link
                  href="/host/new"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 transition"
                >
                  + Host a Table
                </Link>
              )}
              <UserMenu
                name={user.name ?? "User"}
                email={user.email ?? ""}
                avatarUrl={user.image}
                isHostEligible={user.isHostEligible ?? false}
                role={user.role ?? "GUEST"}
              />
            </>
          ) : (
            <>
              <Link href="/signin" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-amber-600 hover:bg-amber-700 px-4 py-1.5 text-sm font-semibold text-white transition shadow-sm"
              >
                Join for free
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
