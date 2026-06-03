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
  const totalSavings = store.orders
    .filter((order) => order.userPhone === phone && order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.discountAmount ?? 0), 0);

  return NextResponse.json({ totalSavings });
}
