import { NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";
import { updateOrderStatus } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["new", "cancelled", "shiprocket_pickup", "delivered"];

export async function POST(request: Request) {
  const { orderId, status, paymentStatus, adminPassword } = (await request.json()) as {
    orderId?: string;
    status?: OrderStatus;
    paymentStatus?: "pending" | "paid";
    adminPassword?: string;
  };

  if (!isAdminPasswordValid(adminPassword)) {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  if (status && !statuses.includes(status)) {
    return NextResponse.json({ error: "Valid status is required." }, { status: 400 });
  }

  if (paymentStatus && paymentStatus !== "pending" && paymentStatus !== "paid") {
    return NextResponse.json({ error: "Valid paymentStatus is required." }, { status: 400 });
  }

  if (!status && !paymentStatus) {
    return NextResponse.json({ error: "At least status or paymentStatus is required." }, { status: 400 });
  }

  const order = await updateOrderStatus(orderId, status, paymentStatus);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
