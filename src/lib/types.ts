export type ProductCategory =
  | "almonds"
  | "cashews"
  | "pistachios"
  | "dates"
  | "raisins"
  | "walnuts"
  | "figs"
  | "saffron"
  | "seeds"
  | "snacks"
  | "gifts"
  | "chocolates";

export interface User {
  name?: string;
  phone: string;
  otpVerified: boolean;
  createdAt: string;
}

export interface CouponUsage {
  id: string;
  phone: string;
  offerId: string;
  discountCode?: string;
  orderId: string;
  savedAmount: number;
  usedAt: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  pricePerKg: number;
  category: ProductCategory;
  description: string;
  stockKg?: number;
  soldOut?: boolean;
  featured?: boolean;
}

export interface Address {
  addressLine: string;
  city: string;
  pinCode: string;
}

export interface SavedAddress extends Address {
  id: string;
  phone: string;
  name: string;
  contactPhone: string;
  isDefault: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantityKg: number;
  pricePerKg: number;
  lineTotal: number;
}

export type OrderStatus = "new" | "cancelled" | "shiprocket_pickup" | "delivered";
export type PaymentMethod = "cash_on_delivery" | "upi";
export type UpiApp = "gpay" | "phonepe";

export interface Order {
  id: string;
  userName?: string;
  userPhone: string;
  address: Address;
  items: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  offerTitle?: string;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  upiApp?: UpiApp;
  paymentStatus?: "pending" | "paid";
  deliveryOtp?: string;
  status: OrderStatus;
  timestamp: string;
  claimedOfferId?: string;
  discountCode?: string;
  isGift?: boolean;
  giftNote?: string;
  giftWrap?: boolean;
  upiScreenshot?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  expiryDate: string;
  discountCode?: string;
  extraItemText?: string;
  autoAddItems?: Array<{
    productId: string;
    quantityKg: number;
  }>;
  active: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  audience: "admin" | "user";
  phone?: string;
  title: string;
  message: string;
  type: "order_placed" | "order_cancelled" | "delivery_otp" | "offer" | "deal" | "product";
  icon?: string;
  deepLink?: string;
  createdAt: string;
  read: boolean;
}

export interface StoreData {
  users: User[];
  addresses: SavedAddress[];
  products: Product[];
  orders: Order[];
  offers: Offer[];
  couponUsages: CouponUsage[];
  notifications: AppNotification[];
  otps: Record<string, string>;
}
