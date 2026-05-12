import { NextResponse } from "next/server";
import { addSavedAddress, deleteSavedAddress, readStore, updateSavedAddress } from "@/lib/store";
import type { SavedAddress } from "@/lib/types";

function cleanPhone(phone?: string) {
  return phone?.replace(/\D/g, "") ?? "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = cleanPhone(url.searchParams.get("phone") ?? "");
  if (!phone) return NextResponse.json({ error: "Phone is required." }, { status: 400 });

  const store = await readStore();
  const addresses = store.addresses.filter((entry) => entry.phone === phone);
  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SavedAddress>;
  const phone = cleanPhone(body.phone);

  if (!phone || !body.name || !body.contactPhone || !body.addressLine || !body.city || !body.pinCode) {
    return NextResponse.json({ error: "Name, phone, address, city, and pin code are required." }, { status: 400 });
  }

  const address = await addSavedAddress({
    phone,
    name: body.name,
    contactPhone: cleanPhone(body.contactPhone),
    addressLine: body.addressLine,
    city: body.city,
    pinCode: body.pinCode,
    landmark: body.landmark ?? "",
    isDefault: Boolean(body.isDefault)
  });

  return NextResponse.json({ address });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<SavedAddress> & { addressId?: string };
  const phone = cleanPhone(body.phone);

  if (!phone || !body.addressId) {
    return NextResponse.json({ error: "Phone and address id are required." }, { status: 400 });
  }

  const address = await updateSavedAddress(body.addressId, phone, {
    name: body.name,
    contactPhone: body.contactPhone ? cleanPhone(body.contactPhone) : undefined,
    addressLine: body.addressLine,
    city: body.city,
    pinCode: body.pinCode,
    landmark: body.landmark,
    isDefault: body.isDefault
  });

  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
  return NextResponse.json({ address });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const phone = cleanPhone(url.searchParams.get("phone") ?? "");
  const addressId = url.searchParams.get("addressId") ?? "";

  if (!phone || !addressId) {
    return NextResponse.json({ error: "Phone and address id are required." }, { status: 400 });
  }

  const deleted = await deleteSavedAddress(addressId, phone);
  if (!deleted) {
    return NextResponse.json({ error: "Address not found or default address cannot be deleted." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
