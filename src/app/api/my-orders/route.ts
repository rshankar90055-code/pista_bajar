import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone")?.replace(/\D/g, "");

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const store = await readStore();
  const orders = store.orders.filter((order) => order.userPhone === phone);

  return NextResponse.json({ orders });
}
