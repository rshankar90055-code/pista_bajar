import { NextResponse } from "next/server";
import { deleteOffer } from "@/lib/store";

export async function POST(request: Request) {
  const { offerId, adminPassword } = (await request.json()) as {
    offerId?: string;
    adminPassword?: string;
  };

  if (adminPassword !== "admin123") {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!offerId) {
    return NextResponse.json({ error: "Offer id is required." }, { status: 400 });
  }

  const deleted = await deleteOffer(offerId);
  if (!deleted) {
    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
