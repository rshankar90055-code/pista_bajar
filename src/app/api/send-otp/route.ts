import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

export async function POST(request: Request) {
  const { phone } = (await request.json()) as { phone?: string };
  const cleanPhone = phone?.replace(/\D/g, "");

  if (!cleanPhone || cleanPhone.length < 10) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
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
