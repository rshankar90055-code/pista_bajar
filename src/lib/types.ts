export type ProductCategory =
  | "almonds"
  | "cashews"
  | "pistachios"
  | "dates"
  | "raisins"
  | "walnuts"
  | "figs";

export interface User {
  phone: string;
  otpVerified: boolean;
  createdAt: string;
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
  landmark: string;
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
export type PaymentMethod = "cash_on_delivery" | "card" | "upi";

export interface Order {
  id: string;
  userPhone: string;
  address: Address;
  items: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  offerTitle?: string;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: "pending" | "paid";
  deliveryOtp?: string;
  status: OrderStatus;
  timestamp: string;
  claimedOfferId?: string;
  discountCode?: string;
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
  type: "order_placed" | "order_cancelled" | "delivery_otp" | "offer" | "deal";
  createdAt: string;
  read: boolean;
}

export interface StoreData {
  users: User[];
  addresses: SavedAddress[];
  products: Product[];
  orders: Order[];
  offers: Offer[];
  notifications: AppNotification[];
  otps: Record<string, string>;
}
