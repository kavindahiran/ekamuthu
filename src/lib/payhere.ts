import crypto from "crypto";

export function computePayHereHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string
): string {
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  return crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${secretHash}`)
    .digest("hex")
    .toUpperCase();
}

// Verifies PayHere's server notification POST
export function verifyPayHereNotification(
  merchantId: string,
  orderId: string,
  payHereAmount: string,
  payHereCurrency: string,
  statusCode: string,
  merchantSecret: string,
  receivedHash: string
): boolean {
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const expected = crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${payHereAmount}${payHereCurrency}${statusCode}${secretHash}`)
    .digest("hex")
    .toUpperCase();

  return expected === receivedHash.toUpperCase();
}

export const PAYHERE_CHECKOUT_URL = process.env.PAYHERE_SANDBOX === "false"
  ? "https://www.payhere.lk/pay/checkout"
  : "https://sandbox.payhere.lk/pay/checkout";
