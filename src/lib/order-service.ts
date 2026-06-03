import { addCouponUsage, addNotification, addOrder, hasUsedCoupon, readStore } from "@/lib/store";
import type { Address, Order, OrderItem, PaymentMethod, UpiApp } from "@/lib/types";
import { sendWhatsAppMessage } from "@/lib/whatsapp-service";

export interface OrderInput {
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

export interface PreparedOrder {
  customerName?: string;
  cleanPhone: string;
  address: Address;
  orderItems: OrderItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  offerTitle?: string;
}

const cashOnDeliveryFee = 9;

export async function prepareOrder(input: OrderInput): Promise<{ prepared?: PreparedOrder; error?: string }> {
  const customerName = input.name?.trim().replace(/\s+/g, " ");
  const cleanPhone = input.phone?.replace(/\D/g, "");

  if (!cleanPhone) return { error: "Login phone number is required." };
  if (!input.address?.addressLine || !input.address.city || !input.address.pinCode) {
    return { error: "Complete delivery address is required." };
  }
  if (!input.items?.length) return { error: "Cart is empty." };

  const store = await readStore();
  const orderItems: OrderItem[] = [];

  for (const item of input.items) {
    const product = store.products.find((entry) => entry.id === item.productId);
    if (!product) return { error: "One item in your cart is no longer available. Please refresh your cart." };
    if (product.soldOut || product.stockKg === 0) return { error: `${product.name} is currently sold out.` };

    const quantityKg = Math.max(0.25, Number(item.quantityKg));
    if (!Number.isFinite(quantityKg)) return { error: "Cart quantity is invalid." };
    if (product.stockKg !== undefined && quantityKg > product.stockKg) {
      return { error: `Only ${product.stockKg}kg of ${product.name} is available.` };
    }

    orderItems.push({
      productId: product.id,
      name: product.name,
      quantityKg,
      pricePerKg: product.pricePerKg,
      lineTotal: Math.round(product.pricePerKg * quantityKg)
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const claimedOffer = input.claimedOfferId
    ? store.offers.find((offer) => offer.id === input.claimedOfferId)
    : input.discountCode
      ? store.offers.find((offer) => offer.discountCode?.toLowerCase() === input.discountCode?.toLowerCase())
      : null;
  if (claimedOffer && (await hasUsedCoupon(cleanPhone, claimedOffer.id, input.discountCode))) {
    return { error: "This coupon has already been used on your account." };
  }
  const discountAmount = input.discountCode ? Math.round(subtotal * 0.1) : 0;
  const codFee = input.paymentMethod === "cash_on_delivery" ? cashOnDeliveryFee : 0;
  
  // Calculate Festive Gift Wrapping Fee (₹49) if gift & wrap enabled
  const giftWrapFee = input.isGift && input.giftWrap ? 49 : 0;
  const totalAmount = subtotal - discountAmount + codFee + giftWrapFee;

  return {
    prepared: {
      customerName,
      cleanPhone,
      address: input.address,
      orderItems,
      subtotal,
      discountAmount,
      totalAmount,
      offerTitle: claimedOffer?.extraItemText ? `${claimedOffer.title} - ${claimedOffer.extraItemText}` : claimedOffer?.title
    }
  };
}

export async function createStoredOrder(
  input: OrderInput,
  prepared: PreparedOrder,
  paymentStatus: "pending" | "paid"
) {
  const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
  const order: Order = {
    id: input.orderId?.trim() || crypto.randomUUID(),
    userName: prepared.customerName,
    userPhone: prepared.cleanPhone,
    address: prepared.address,
    items: prepared.orderItems,
    subtotalAmount: prepared.subtotal,
    discountAmount: prepared.discountAmount,
    offerTitle: prepared.offerTitle,
    totalAmount: prepared.totalAmount,
    paymentMethod: input.paymentMethod,
    upiApp: input.paymentMethod === "upi" ? input.upiApp : undefined,
    paymentStatus,
    deliveryOtp,
    status: "new",
    timestamp: new Date().toISOString(),
    claimedOfferId: input.claimedOfferId,
    discountCode: input.discountCode,
    isGift: input.isGift,
    giftNote: input.isGift ? input.giftNote : undefined,
    giftWrap: input.isGift ? input.giftWrap : undefined,
    upiScreenshot: input.upiScreenshot
  };

  await addOrder(order);
  if (order.claimedOfferId && order.discountCode && order.discountAmount) {
    await addCouponUsage({
      phone: order.userPhone,
      offerId: order.claimedOfferId,
      discountCode: order.discountCode,
      orderId: order.id,
      savedAmount: order.discountAmount
    });
  }
  await addNotification({
    audience: "admin",
    title: "New Dry Fruit Order",
    message: `${order.userName ? `${order.userName} (${order.userPhone})` : order.userPhone} placed an order for ₹${order.totalAmount}.`,
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
  await sendWhatsAppMessage({
    phone: order.userPhone,
    title: "Pista Bajaar order placed",
    message: `Your order for ₹${order.totalAmount} is confirmed. Delivery OTP: ${deliveryOtp}.`,
    deepLink: "/orders"
  });

  return {
    order,
    adminAlert: `New Dry Fruit Order: ${order.userName ? `${order.userName} (${order.userPhone})` : order.userPhone} - ${order.address.addressLine}, ${order.address.city} ${order.address.pinCode}`
  };
}
