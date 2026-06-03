import { NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";
import { notifyUsers } from "@/lib/notification-service";
import { updateOffer } from "@/lib/store";
import type { Offer } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Offer> & {
    offerId?: string;
    adminPassword?: string;
  };

  if (!isAdminPasswordValid(body.adminPassword)) {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!body.offerId) {
    return NextResponse.json({ error: "Offer id is required." }, { status: 400 });
  }

  const updates: Partial<Offer> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.expiryDate === "string") updates.expiryDate = body.expiryDate;
  if (typeof body.discountCode === "string") updates.discountCode = body.discountCode;
  if (typeof body.extraItemText === "string") updates.extraItemText = body.extraItemText;
  if (Array.isArray(body.autoAddItems)) updates.autoAddItems = body.autoAddItems;
  if (body.active !== undefined) updates.active = Boolean(body.active);

  if (!updates.title || !updates.description || !updates.expiryDate) {
    return NextResponse.json({ error: "Title, description, and expiry date are required." }, { status: 400 });
  }

  const offer = await updateOffer(body.offerId, updates);
  if (!offer) {
    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  }

  if (offer.active) {
    await notifyUsers({
      title: `Offer updated: ${offer.title}`,
      message: offer.description,
      type: "deal",
      deepLink: "/coupons"
    });
  }

  return NextResponse.json({ offer });
}
