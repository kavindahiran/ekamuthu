import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePayHereHash, PAYHERE_CHECKOUT_URL } from "@/lib/payhere";
import { PaymentTabs } from "@/components/payment/PaymentTabs";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function PaymentPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/guest/pay/${bookingId}`);

  const [booking, user] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        guestId: true,
        status: true,
        seatsRequested: true,
        listing: {
          select: {
            id: true,
            title: true,
            dinnerDate: true,
            area: true,
            city: true,
            pricePerSeatLKR: true,
            host: { select: { name: true, displayName: true } },
          },
        },
        payment: { select: { id: true, status: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
  ]);

  if (!booking || booking.guestId !== session.user.id) notFound();
  if (booking.status !== "APPROVED") redirect("/guest/bookings");
  if (booking.payment?.status === "COMPLETED") redirect("/guest/bookings");

  const amountLKR = Number(booking.listing.pricePerSeatLKR) * booking.seatsRequested;
  const amountStr = amountLKR.toFixed(2);
  const orderId = `DC-${booking.id.slice(-8).toUpperCase()}`;

  // Create a PENDING Payment record now so the PayHere webhook can find it
  // by transactionRef when PayHere calls back. Safe to call on every page load — upsert.
  if (!booking.payment) {
    await prisma.payment.create({
      data: {
        bookingId,
        amountLKR,
        paymentMethod: "CARD",
        paymentGateway: "PAYHERE",
        status: "PENDING",
        transactionRef: orderId,
      },
    });
  }
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // PayHere params (only rendered when credentials are configured)
  const merchantId = process.env.PAYHERE_MERCHANT_ID ?? "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET ?? "";
  const payHereConfigured = merchantId.length > 0 && merchantSecret.length > 0;

  const [firstName, ...rest] = (user?.name ?? "Guest").split(" ");
  const lastName = rest.join(" ") || firstName;

  const payHereParams = payHereConfigured
    ? {
        checkoutUrl: PAYHERE_CHECKOUT_URL,
        merchantId,
        returnUrl:  `${baseUrl}/guest/bookings?paid=1`,
        cancelUrl:  `${baseUrl}/guest/pay/${bookingId}`,
        notifyUrl:  `${baseUrl}/api/payhere/notify`,
        orderId,
        items:      `Dinner seat — ${booking.listing.title}`,
        currency:   "LKR",
        amount:     amountStr,
        firstName,
        lastName,
        email:      user?.email ?? "",
        phone:      user?.phone ?? "",
        address:    booking.listing.area,
        city:       booking.listing.city,
        country:    "Sri Lanka",
        hash:       computePayHereHash(merchantId, orderId, amountStr, "LKR", merchantSecret),
      }
    : null;

  const bankDetails = {
    bankName:      process.env.BANK_NAME          ?? "Commercial Bank of Ceylon",
    accountName:   process.env.BANK_ACCOUNT_NAME  ?? "Ekamuthu",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? "—",
    branch:        process.env.BANK_BRANCH        ?? "—",
    swiftCode:     process.env.BANK_SWIFT_CODE    ?? "—",
  };

  const hostName = booking.listing.host.displayName ?? booking.listing.host.name;
  const dinnerDate = new Date(booking.listing.dinnerDate);

  return (
    <div className="max-w-lg mx-auto space-y-6">

      <div>
        <Link href="/guest/bookings" className="text-sm text-stone-500 hover:text-stone-900 transition">
          ← Back to my bookings
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">Complete payment</h1>
      </div>

      {/* Booking summary */}
      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Booking summary</h2>
        <div>
          <p className="font-semibold text-stone-900">{booking.listing.title}</p>
          <p className="text-sm text-stone-500 mt-0.5">
            📅 {dinnerDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            {dinnerDate.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </p>
          <p className="text-sm text-stone-500">📍 {booking.listing.area}, {booking.listing.city}</p>
          <p className="text-sm text-stone-500">👤 Hosted by {hostName}</p>
        </div>
        <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
          <span className="text-sm text-stone-600">
            {booking.seatsRequested} seat{booking.seatsRequested > 1 ? "s" : ""} ×{" "}
            LKR {Number(booking.listing.pricePerSeatLKR).toLocaleString("en-LK")}
          </span>
          <span className="text-lg font-bold text-stone-900">
            LKR {amountLKR.toLocaleString("en-LK")}
          </span>
        </div>
      </div>

      {/* Dev notice when PayHere not configured */}
      {!payHereConfigured && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          <strong>Dev mode:</strong> PayHere credentials not set in <code>.env</code>. Bank transfer is available for testing. Set <code>PAYHERE_MERCHANT_ID</code> and <code>PAYHERE_MERCHANT_SECRET</code> to enable card payments.
        </div>
      )}

      {/* Payment method tabs */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Choose payment method</h2>
        <PaymentTabs
          bookingId={bookingId}
          amountLKR={amountLKR}
          payHere={payHereParams}
          bank={bankDetails}
        />
      </div>

      <p className="text-xs text-stone-400 text-center">
        Payment secures your seat. Cancellations are subject to the host&apos;s policy.
      </p>

    </div>
  );
}
