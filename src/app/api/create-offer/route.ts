import { NextResponse } from "next/server";
import { addNotification, readStore, writeStore } from "@/lib/store";
import type { Offer } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Offer> & { adminPassword?: string };

  if (body.adminPassword !== "admin123") {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!body.title || !body.description || !body.expiryDate) {
    return NextResponse.json({ error: "Title, description, and expiry date are required." }, { status: 400 });
  }

  const store = await readStore();
  const offer: Offer = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    expiryDate: body.expiryDate,
    discountCode: body.discountCode || "DRYFRUIT10",
    extraItemText: body.extraItemText || "",
    autoAddItems: Array.isArray(body.autoAddItems) ? body.autoAddItems : [],
    active: true,
    createdAt: new Date().toISOString()
  };

  store.offers.unshift(offer);
  await writeStore(store);
  await addNotification({
    audience: "user",
    title: `New Offer: ${offer.title}`,
    message: offer.description,
    type: "offer"
  });

  return NextResponse.json({ offer });
}
