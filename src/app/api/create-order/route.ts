import { NextResponse } from "next/server";
import { addNotification, addOrder, readStore } from "@/lib/store";
import type { Address, Order, OrderItem, PaymentMethod } from "@/lib/types";

interface CreateOrderBody {
  phone?: string;
  address?: Address;
  items?: Array<{ productId: string; quantityKg: number }>;
  claimedOfferId?: string;
  discountCode?: string;
  paymentMethod?: PaymentMethod;
}

const paymentMethods: PaymentMethod[] = ["cash_on_delivery", "card", "upi"];
const cashOnDeliveryFee = 9;

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

  const store = await readStore();
  const orderItems: OrderItem[] = body.items.map((item) => {
    const product = store.products.find((entry) => entry.id === item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const quantityKg = Math.max(0.25, Number(item.quantityKg));
    return {
      productId: product.id,
      name: product.name,
      quantityKg,
      pricePerKg: product.pricePerKg,
      lineTotal: Math.round(product.pricePerKg * quantityKg)
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const claimedOffer = body.claimedOfferId ? store.offers.find((offer) => offer.id === body.claimedOfferId) : null;
  const discountAmount = body.discountCode ? Math.round(subtotal * 0.1) : 0;
  const codFee = body.paymentMethod === "cash_on_delivery" ? cashOnDeliveryFee : 0;
  const totalAmount = subtotal - discountAmount + codFee;
  const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

  const order: Order = {
    id: crypto.randomUUID(),
    userPhone: cleanPhone,
    address: body.address,
    items: orderItems,
    subtotalAmount: subtotal,
    discountAmount,
    offerTitle: claimedOffer?.extraItemText ? `${claimedOffer.title} - ${claimedOffer.extraItemText}` : claimedOffer?.title,
    totalAmount,
    paymentMethod: body.paymentMethod,
    paymentStatus: body.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
    deliveryOtp,
    status: "new",
    timestamp: new Date().toISOString(),
    claimedOfferId: body.claimedOfferId,
    discountCode: body.discountCode
  };

  await addOrder(order);
  await addNotification({
    audience: "admin",
    title: "New Dry Fruit Order",
    message: `${order.userPhone} placed an order for ₹${order.totalAmount}.`,
    type: "order_placed"
  });
  await addNotification({
    audience: "user",
    phone: order.userPhone,
    title: "Order placed",
    message: `Your order is confirmed. Delivery OTP: ${deliveryOtp}.`,
    type: "order_placed"
  });
  await addNotification({
    audience: "user",
    phone: order.userPhone,
    title: "Delivery OTP",
    message: `Share OTP ${deliveryOtp} only when receiving your dry fruits order.`,
    type: "delivery_otp"
  });

  return NextResponse.json({
    order,
    adminAlert: `New Dry Fruit Order: ${order.userPhone} - ${order.address.addressLine}, ${order.address.city} ${order.address.pinCode}`
  });
}
