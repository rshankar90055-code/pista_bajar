import { NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";
import { markNotificationsRead, readStore } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const audience = url.searchParams.get("audience");
  const phone = url.searchParams.get("phone")?.replace(/\D/g, "");
  const adminPassword = url.searchParams.get("adminPassword");

  const store = await readStore();

  if (audience === "admin") {
    if (!isAdminPasswordValid(adminPassword)) {
      return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
    }
    return NextResponse.json({ notifications: store.notifications.filter((entry) => entry.audience === "admin") });
  }

  if (audience === "user") {
    if (!phone) return NextResponse.json({ error: "Phone is required." }, { status: 400 });
    return NextResponse.json({
      notifications: store.notifications.filter((entry) => entry.audience === "user" && (!entry.phone || entry.phone === phone))
    });
  }

  return NextResponse.json({ error: "Audience is required." }, { status: 400 });
}

export async function POST(request: Request) {
  const { ids } = (await request.json()) as { ids?: string[] };
  await markNotificationsRead(ids ?? []);
  return NextResponse.json({ ok: true });
}
