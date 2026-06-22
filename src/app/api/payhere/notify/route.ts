import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayHereNotification } from "@/lib/payhere";

// PayHere sends a server-to-server POST to this URL after every payment event.
// We MUST return 200 OK — any other status causes PayHere to retry.
// This endpoint is intentionally public (no session auth — PayHere calls it directly).

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const merchantId    = formData.get("merchant_id")    as string;
    const orderId       = formData.get("order_id")       as string;
    const payHereAmount = formData.get("payhere_amount") as string;
    const payhereCC     = formData.get("payhere_currency") as string;
    const statusCode    = formData.get("status_code")    as string;
    const md5sig        = formData.get("md5sig")         as string;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET ?? "";

    // Verify the hash before trusting any data
    const valid = verifyPayHereNotification(
      merchantId, orderId, payHereAmount, payhereCC,
      statusCode, merchantSecret, md5sig
    );

    if (!valid) {
      console.error("[payhere/notify] Invalid hash — possible forgery");
      return NextResponse.json({ ok: false }, { status: 200 }); // still 200 so PayHere stops retrying
    }

    // Look up the Payment row we created when the guest opened the payment page.
    // transactionRef was set to orderId at that point.
    const payment = await prisma.payment.findFirst({
      where: { transactionRef: orderId },
      select: {
        id: true,
        status: true,
        booking: { select: { id: true, seatsRequested: true, listingId: true } },
      },
    });

    if (!payment) {
      console.error("[payhere/notify] Payment not found for orderId:", orderId);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // statusCode 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback
    if (statusCode === "2") {
      if (payment.status === "COMPLETED") {
        return NextResponse.json({ ok: true }, { status: 200 }); // idempotent
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
            transactionRef: orderId,
            gatewayResponse: Object.fromEntries(formData.entries()) as any,
          },
        });

        await tx.booking.update({
          where: { id: payment.booking.id },
          data: { status: "PAID" },
        });

        const listing = await tx.dinnerListing.update({
          where: { id: payment.booking.listingId },
          data: { seatsAvailable: { decrement: payment.booking.seatsRequested } },
          select: { seatsAvailable: true },
        });

        if (listing.seatsAvailable <= 0) {
          await tx.dinnerListing.update({
            where: { id: payment.booking.listingId },
            data: { status: "FULL" },
          });
        }
      });

      console.log("[payhere/notify] Payment confirmed for booking:", payment.booking.id);
    } else if (statusCode === "-1" || statusCode === "-2") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: `PayHere status code: ${statusCode}` },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[payhere/notify] Error:", err);
    return NextResponse.json({ ok: false }, { status: 200 }); // always 200 to PayHere
  }
}
