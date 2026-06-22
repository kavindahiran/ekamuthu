"use client";

import { useState, useActionState } from "react";
import { submitBankTransferAction } from "@/actions/payment.actions";

interface PayHereParams {
  checkoutUrl: string;
  merchantId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  orderId: string;
  items: string;
  currency: string;
  amount: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
}

interface Props {
  bookingId: string;
  amountLKR: number;
  payHere: PayHereParams | null; // null when merchant ID not configured
  bank: BankDetails;
}

export function PaymentTabs({ bookingId, amountLKR, payHere, bank }: Props) {
  const [tab, setTab] = useState<"payhere" | "bank">(payHere ? "payhere" : "bank");
  const [bankState, bankAction, bankPending] = useActionState(submitBankTransferAction, null);

  const price = amountLKR.toLocaleString("en-LK");

  const tabBtn = (id: "payhere" | "bank", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition cursor-pointer ${
        tab === id
          ? "bg-white shadow-sm text-stone-900"
          : "text-stone-500 hover:text-stone-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">

      {/* Tab switcher */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
        {payHere && tabBtn("payhere", "💳 Card / Wallet")}
        {tabBtn("bank", "🏦 Bank Transfer")}
      </div>

      {/* PayHere tab */}
      {tab === "payhere" && payHere && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Pay securely via PayHere. Accepts Visa, Mastercard, and mobile wallets (FriMi, Genie, eZ Cash).
          </p>
          <form method="POST" action={payHere.checkoutUrl}>
            <input type="hidden" name="merchant_id"  value={payHere.merchantId} />
            <input type="hidden" name="return_url"   value={payHere.returnUrl} />
            <input type="hidden" name="cancel_url"   value={payHere.cancelUrl} />
            <input type="hidden" name="notify_url"   value={payHere.notifyUrl} />
            <input type="hidden" name="order_id"     value={payHere.orderId} />
            <input type="hidden" name="items"        value={payHere.items} />
            <input type="hidden" name="currency"     value={payHere.currency} />
            <input type="hidden" name="amount"       value={payHere.amount} />
            <input type="hidden" name="first_name"   value={payHere.firstName} />
            <input type="hidden" name="last_name"    value={payHere.lastName} />
            <input type="hidden" name="email"        value={payHere.email} />
            <input type="hidden" name="phone"        value={payHere.phone} />
            <input type="hidden" name="address"      value={payHere.address} />
            <input type="hidden" name="city"         value={payHere.city} />
            <input type="hidden" name="country"      value={payHere.country} />
            <input type="hidden" name="hash"         value={payHere.hash} />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition cursor-pointer"
            >
              Pay LKR {price} with PayHere
            </button>
          </form>
          <p className="text-xs text-stone-400 text-center">You will be redirected to PayHere&apos;s secure checkout.</p>
        </div>
      )}

      {/* Bank transfer tab */}
      {tab === "bank" && (
        <div className="space-y-5">
          {bankState?.success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-emerald-800">Transfer submitted</p>
              <p className="text-sm text-emerald-700 mt-1">
                Our team will verify your transfer within 24 hours and confirm your seat.
              </p>
            </div>
          ) : (
            <>
              {/* Bank account details */}
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Transfer to this account</p>
                <BankRow label="Bank" value={bank.bankName} />
                <BankRow label="Account name" value={bank.accountName} copyable />
                <BankRow label="Account number" value={bank.accountNumber} copyable />
                <BankRow label="Branch" value={bank.branch} />
                <BankRow label="SWIFT / BIC" value={bank.swiftCode} />
                <div className="mt-3 pt-3 border-t border-stone-200">
                  <BankRow label="Amount" value={`LKR ${price}`} highlight />
                  <p className="text-xs text-stone-400 mt-1">Use your name as the payment reference.</p>
                </div>
              </div>

              {/* Reference submission */}
              <form action={bankAction} className="space-y-3">
                <input type="hidden" name="bookingId" value={bookingId} />

                {bankState?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {bankState.error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Your bank reference / transaction ID *
                  </label>
                  <input
                    name="bankRef"
                    type="text"
                    required
                    placeholder="e.g. TXN123456789"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <p className="mt-1 text-xs text-stone-400">Found on your bank receipt or online banking confirmation.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Your bank name (optional)
                  </label>
                  <input
                    name="bankName"
                    type="text"
                    placeholder="e.g. People's Bank"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bankPending}
                  className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold py-3 transition cursor-pointer"
                >
                  {bankPending ? "Submitting…" : "I've made the transfer"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BankRow({ label, value, copyable, highlight }: { label: string; value: string; copyable?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-stone-400 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-amber-700" : "text-stone-800"} text-right`}>
        {value}
        {copyable && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(value)}
            className="ml-2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            copy
          </button>
        )}
      </span>
    </div>
  );
}
