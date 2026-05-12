import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminPassword = url.searchParams.get("adminPassword");

  if (adminPassword !== "admin123") {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  const store = await readStore();
  return NextResponse.json({ orders: store.orders });
}
