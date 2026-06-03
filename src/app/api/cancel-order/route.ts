import { NextResponse } from "next/server";
import { addNotification, readStore, updateOrderStatus } from "@/lib/store";
import { sendWhatsAppMessage } from "@/lib/whatsapp-service";

export async function POST(request: Request) {
  try {
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

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "This order is already cancelled." }, { status: 400 });
    }

    if (order.status === "delivered") {
      return NextResponse.json({ error: "Delivered orders cannot be cancelled." }, { status: 400 });
    }

    const updatedOrder = await updateOrderStatus(orderId, "cancelled");
    if (!updatedOrder) {
      return NextResponse.json({ error: "Could not update this order." }, { status: 500 });
    }

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
    await sendWhatsAppMessage({
      phone: cleanPhone,
      title: "Pista Bajar order cancelled",
      message: `Your order ${orderId.slice(0, 8)} has been cancelled successfully.`,
      deepLink: "/orders"
    });
    return NextResponse.json({ order: updatedOrder });
  } catch {
    return NextResponse.json({ error: "Could not cancel order. Please try again." }, { status: 500 });
  }
}
