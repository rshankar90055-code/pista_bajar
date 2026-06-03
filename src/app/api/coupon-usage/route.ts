import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

function cleanPhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = cleanPhone(url.searchParams.get("phone"));
  if (!phone) {
    return NextResponse.json({ error: "Phone is required." }, { status: 400 });
  }

  const store = await readStore();
  const usages = store.couponUsages.filter((entry) => entry.phone === phone);
  return NextResponse.json({
    usages,
    usedOfferIds: usages.map((entry) => entry.offerId),
    totalSavings: usages.reduce((sum, entry) => sum + entry.savedAmount, 0)
  });
}
