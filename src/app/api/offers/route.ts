import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const store = await readStore();
  const today = new Date();
  const offers = includeInactive
    ? store.offers
    : store.offers.filter((offer) => offer.active && new Date(`${offer.expiryDate}T23:59:59`) >= today);
  return NextResponse.json({ offers });
}
