import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtp(toEmail: string, otp: string): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`\n[OTP DEV] ──────────────────────────`);
    console.log(`  To:  ${toEmail}`);
    console.log(`  OTP: ${otp}`);
    console.log(`────────────────────────────────────\n`);
    return;
  }

  await transporter.sendMail({
    from: `"Ekamuthu · එකමුතු" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your Ekamuthu verification code: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fafaf9;border-radius:12px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#1c1917">Verify your phone number</h2>
        <p style="margin:0 0 24px;color:#57534e;font-size:15px">
          Use the code below to verify your phone number on Ekamuthu.
          It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#fff;border:1px solid #e7e5e4;border-radius:8px;padding:20px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1c1917">${otp}</span>
        </div>
        <p style="margin:24px 0 0;color:#a8a29e;font-size:13px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
