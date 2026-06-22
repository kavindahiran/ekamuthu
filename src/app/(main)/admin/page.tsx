import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmBankTransferAction, rejectBankTransferAction } from "@/actions/payment.actions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [pendingPayments, pendingVerifications, stats] = await Promise.all([
    // Bank transfers awaiting confirmation
    prisma.payment.findMany({
      where: { status: "PENDING", paymentGateway: "MANUAL" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        amountLKR: true,
        bankRef: true,
        bankName: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            seatsRequested: true,
            guest: { select: { name: true, email: true, phone: true } },
            listing: {
              select: { title: true, dinnerDate: true, city: true },
            },
          },
        },
      },
    }),

    // ID verifications pending review
    prisma.user.findMany({
      where: { idVerificationStatus: "PENDING" },
      orderBy: { updatedAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        nicNumber: true,
        passportNumber: true,
        idDocumentUrl: true,
        idVerificationStatus: true,
      },
    }),

    // Platform stats
    prisma.$transaction([
      prisma.user.count(),
      prisma.dinnerListing.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count({ where: { status: "PAID" } }),
    ]),
  ]);

  const [totalUsers, activeListings, paidBookings] = stats;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Admin Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Platform management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total users" value={totalUsers} />
        <StatCard label="Active dinners" value={activeListings} />
        <StatCard label="Confirmed bookings" value={paidBookings} />
        <StatCard label="Pending payments" value={pendingPayments.length} highlight={pendingPayments.length > 0} />
      </div>

      {/* Pending bank transfers */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-stone-900">
          Pending Bank Transfers
          {pendingPayments.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {pendingPayments.length}
            </span>
          )}
        </h2>

        {pendingPayments.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center border border-dashed border-stone-200 rounded-xl">
            No pending bank transfers
          </p>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((payment) => {
              const dinnerDate = new Date(payment.booking.listing.dinnerDate);
              return (
                <div key={payment.id} className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-stone-900">{payment.booking.guest.name}</p>
                      <p className="text-xs text-stone-500">{payment.booking.guest.email} · {payment.booking.guest.phone}</p>
                      <p className="text-sm text-stone-600">
                        Dinner: <span className="font-medium">{payment.booking.listing.title}</span>
                        {" · "}{dinnerDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {" · "}{payment.booking.listing.city}
                      </p>
                      <p className="text-sm text-stone-600">
                        Seats: {payment.booking.seatsRequested}
                        {" · "}
                        <span className="font-semibold text-stone-900">
                          LKR {Number(payment.amountLKR).toLocaleString("en-LK")}
                        </span>
                      </p>
                      <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 mt-2 inline-block">
                        <p className="text-xs text-stone-400">Bank ref</p>
                        <p className="text-sm font-mono font-semibold text-stone-800">{payment.bankRef}</p>
                        {payment.bankName && <p className="text-xs text-stone-400">{payment.bankName}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <form action={confirmBankTransferAction}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition cursor-pointer w-full"
                        >
                          ✓ Confirm
                        </button>
                      </form>
                      <form action={rejectBankTransferAction}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-sm font-medium px-4 py-2 transition cursor-pointer w-full"
                        >
                          ✗ Reject
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-stone-400">
                    Submitted {formatTimeAgo(new Date(payment.createdAt))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending ID verifications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            ID Verifications
            {pendingVerifications.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {pendingVerifications.length}
              </span>
            )}
          </h2>
          <Link href="/admin/verifications" className="text-sm text-amber-600 hover:underline">
            View all →
          </Link>
        </div>

        {pendingVerifications.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center border border-dashed border-stone-200 rounded-xl">
            No pending ID verifications
          </p>
        ) : (
          <div className="space-y-2">
            {pendingVerifications.map((u) => (
              <div key={u.id} className="rounded-xl border border-stone-100 bg-white px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900 text-sm">{u.name}</p>
                  <p className="text-xs text-stone-400">{u.email}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {u.nicNumber ? `NIC: ${u.nicNumber}` : u.passportNumber ? `Passport: ${u.passportNumber}` : "No document number"}
                  </p>
                </div>
                <Link
                  href={`/admin/verifications/${u.id}`}
                  className="text-sm text-amber-600 hover:text-amber-800 font-medium flex-shrink-0"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${highlight ? "border-amber-200 bg-amber-50" : "border-stone-100 bg-white"}`}>
      <p className={`text-2xl font-bold ${highlight ? "text-amber-700" : "text-stone-900"}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
