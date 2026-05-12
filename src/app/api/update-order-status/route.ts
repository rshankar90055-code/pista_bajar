import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["new", "cancelled", "shiprocket_pickup", "delivered"];

export async function POST(request: Request) {
  const { orderId, status, adminPassword } = (await request.json()) as {
    orderId?: string;
    status?: OrderStatus;
    adminPassword?: string;
  };

  if (adminPassword !== "admin123") {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!orderId || !status || !statuses.includes(status)) {
    return NextResponse.json({ error: "Valid orderId and status are required." }, { status: 400 });
  }

  const order = await updateOrderStatus(orderId, status);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
