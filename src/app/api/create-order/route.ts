import { NextResponse } from "next/server";
import { createStoredOrder, prepareOrder } from "@/lib/order-service";
import type { Address, PaymentMethod, UpiApp } from "@/lib/types";

interface CreateOrderBody {
  orderId?: string;
  name?: string;
  phone?: string;
  address?: Address;
  items?: Array<{ productId: string; quantityKg: number }>;
  claimedOfferId?: string;
  discountCode?: string;
  paymentMethod?: PaymentMethod;
  upiApp?: UpiApp;
  isGift?: boolean;
  giftNote?: string;
  giftWrap?: boolean;
  upiScreenshot?: string;
}

const paymentMethods: PaymentMethod[] = ["cash_on_delivery", "upi"];
const upiApps: UpiApp[] = ["gpay", "phonepe"];

export async function POST(request: Request) {
  const body = (await request.json()) as CreateOrderBody;
  const cleanPhone = body.phone?.replace(/\D/g, "");

  if (!cleanPhone) {
    return NextResponse.json({ error: "Login phone number is required." }, { status: 400 });
  }

  if (!body.address?.addressLine || !body.address.city || !body.address.pinCode) {
    return NextResponse.json({ error: "Complete delivery address is required." }, { status: 400 });
  }

  if (!body.items?.length) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  if (!body.paymentMethod || !paymentMethods.includes(body.paymentMethod)) {
    return NextResponse.json({ error: "Choose a payment method before confirming the order." }, { status: 400 });
  }

  if (body.paymentMethod === "upi" && (!body.upiApp || !upiApps.includes(body.upiApp))) {
    return NextResponse.json({ error: "Choose GPay or PhonePe before confirming the order." }, { status: 400 });
  }

  const { prepared, error } = await prepareOrder(body);
  if (!prepared) return NextResponse.json({ error }, { status: 400 });

  const result = await createStoredOrder(body, prepared, "pending");
  return NextResponse.json(result);
}
