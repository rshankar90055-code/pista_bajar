import { NextResponse } from "next/server";
import { readStore, upsertUser, writeStore } from "@/lib/store";

export async function POST(request: Request) {
  const { phone, otp } = (await request.json()) as { phone?: string; otp?: string };
  const cleanPhone = phone?.replace(/\D/g, "");

  if (!cleanPhone || !otp) {
    return NextResponse.json({ error: "Phone and OTP are required." }, { status: 400 });
  }

  const store = await readStore();
  if (store.otps[cleanPhone] !== otp) {
    return NextResponse.json({ error: "Invalid OTP. Use 123456 in local dev." }, { status: 401 });
  }

  delete store.otps[cleanPhone];
  await writeStore(store);
  const user = await upsertUser(cleanPhone, true);

  return NextResponse.json({ user });
}
