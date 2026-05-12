import { NextResponse } from "next/server";
import { addNotification, readStore, updateOrderStatus } from "@/lib/store";

export async function POST(request: Request) {
  const { orderId, phone } = (await request.json()) as {
    orderId?: string;
    phone?: string;
  };

  const cleanPhone = phone?.replace(/\D/g, "");
  if (!orderId || !cleanPhone) {
    return NextResponse.json({ error: "Order id and phone are required." }, { status: 400 });
  }

  const store = await readStore();
  const order = store.orders.find((entry) => entry.id === orderId && entry.userPhone === cleanPhone);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "new") {
    return NextResponse.json({ error: "Only new orders can be cancelled." }, { status: 400 });
  }

  const updatedOrder = await updateOrderStatus(orderId, "cancelled");
  await addNotification({
    audience: "admin",
    title: "Order cancelled",
    message: `${cleanPhone} cancelled order ${orderId}.`,
    type: "order_cancelled"
  });
  await addNotification({
    audience: "user",
    phone: cleanPhone,
    title: "Order cancelled",
    message: "Your order has been cancelled successfully.",
    type: "order_cancelled"
  });
  return NextResponse.json({ order: updatedOrder });
}
