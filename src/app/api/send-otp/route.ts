import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

const msg91AuthKey = process.env.MSG91_AUTH_KEY;
const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
const msg91CountryCode = process.env.MSG91_COUNTRY_CODE ?? "91";
const msg91OtpLength = process.env.MSG91_OTP_LENGTH ?? "6";
const msg91OtpExpiry = process.env.MSG91_OTP_EXPIRY_MINUTES ?? "5";
const isProduction = process.env.NODE_ENV === "production";
const seededOtpPhone = "9353339861";
const seededOtp = "123456";

function formatMobile(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `${msg91CountryCode}${digits}`;
  return digits;
}

async function withRetry(task: () => Promise<void>, attempts = 2) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await task();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function sendMsg91Otp(mobile: string) {
  if (!msg91AuthKey || !msg91TemplateId) {
    throw new Error("MSG91 credentials are not configured.");
  }

  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", msg91TemplateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp_length", msg91OtpLength);
  url.searchParams.set("otp_expiry", msg91OtpExpiry);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authkey: msg91AuthKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({})
  });
  const data = (await response.json().catch(() => ({}))) as { type?: string; message?: string };

  if (!response.ok || data.type === "error") {
    throw new Error(data.message || "MSG91 could not send OTP.");
  }
}

export async function POST(request: Request) {
  const { phone } = (await request.json()) as { phone?: string };
  const cleanPhone = phone?.replace(/\D/g, "");

  if (!cleanPhone || cleanPhone.length < 10) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  if (cleanPhone === seededOtpPhone) {
    return NextResponse.json({ message: "OTP sent successfully." });
  }

  if (msg91AuthKey && msg91TemplateId) {
    try {
      await withRetry(() => sendMsg91Otp(formatMobile(cleanPhone)), 2);
      return NextResponse.json({ message: "OTP sent successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send OTP.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (isProduction) {
    return NextResponse.json({ error: "OTP service is not configured." }, { status: 500 });
  }

  const store = await readStore();
  const otp = "123456";
  store.otps[cleanPhone] = otp;
  await writeStore(store);

  return NextResponse.json({
    message: "OTP sent successfully.",
    devOtp: otp
  });
}
