"use client";

import { useActionState } from "react";
import { sendOtpAction, verifyOtpAction } from "@/actions/phone.actions";
import type { SendOtpResult } from "@/actions/phone.actions";

export default function VerifyPhonePage() {
  const [sendState, sendAction, sendPending] = useActionState(sendOtpAction, null);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpAction, null);

  // After OTP is sent successfully, switch to the verification step
  const otpSent = sendState && "success" in sendState;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <span className="text-2xl">{otpSent ? "✉️" : "📱"}</span>
          </div>
          <h1 className="text-xl font-semibold text-stone-900">
            {otpSent ? "Enter your code" : "Verify your number"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {otpSent
              ? `We sent a 6-digit code to ${(sendState as { success: true; email: string }).email}`
              : "Required before you can book or host a dinner."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7">

          {!otpSent ? (
            /* ── Step 1: Enter phone number ── */
            <form action={sendAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Mobile number
                </label>
                <div className="flex rounded-lg border border-stone-200 overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <span className="flex items-center px-3 bg-stone-50 border-r border-stone-200 text-sm text-stone-500 select-none">
                    🇱🇰 +94
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="77 123 4567"
                    autoComplete="tel"
                    className="flex-1 px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none bg-white"
                  />
                </div>
                <p className="mt-1 text-xs text-stone-400">
                  Dialog, Mobitel, Hutch, Airtel — any LK mobile
                </p>
              </div>

              {sendState && "error" in sendState && (
                <p className="text-sm text-red-600">{sendState.error}</p>
              )}

              <button
                type="submit"
                disabled={sendPending}
                className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 transition cursor-pointer"
              >
                {sendPending ? "Sending…" : "Send verification code"}
              </button>
            </form>

          ) : (
            /* ── Step 2: Enter OTP ── */
            <form action={verifyAction} className="space-y-4">

              {/* Dev mode: show the OTP on screen */}
              {"devOtp" in sendState && sendState.devOtp && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    DEV MODE — Gmail not configured
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-amber-900">
                    {sendState.devOtp}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  6-digit code
                </label>
                <input
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-center text-xl font-mono tracking-widest text-stone-900 placeholder-stone-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              {verifyState && "error" in verifyState && (
                <p className="text-sm text-red-600">{verifyState.error}</p>
              )}

              <button
                type="submit"
                disabled={verifyPending}
                className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 transition cursor-pointer"
              >
                {verifyPending ? "Verifying…" : "Verify number"}
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full text-center text-sm text-stone-500 hover:text-stone-700 transition"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
