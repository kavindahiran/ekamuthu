import Navbar from "@/components/layout/Navbar";

// This layout wraps all main app pages (browse, profile, bookings, host dashboard).
// Auth pages (/signin, /register) use their own separate layout in (auth)/layout.tsx.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </>
  );
}
