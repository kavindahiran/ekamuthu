"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOutAction } from "@/actions/auth.actions";

interface Props {
  name: string;
  email: string;
  avatarUrl?: string | null;
  isHostEligible: boolean;
  role: string;
}

export function UserMenu({ name, email, avatarUrl, isHostEligible, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-stone-100 transition cursor-pointer"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
        )}
        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-stone-100 bg-white shadow-lg z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-900 truncate">{name}</p>
            <p className="text-xs text-stone-400 truncate">{email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
            >
              My Profile
            </Link>
            <Link
              href="/guest/bookings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
            >
              My Bookings
            </Link>
            {isHostEligible && (
              <Link
                href="/host/dashboard"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
              >
                Host Dashboard
              </Link>
            )}
            {role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-stone-100 py-1">
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
