import { promises as fs } from "fs";
import path from "path";
import type { AppNotification, Offer, Order, OrderStatus, Product, SavedAddress, StoreData, User } from "@/lib/types";
import { defaultProducts } from "@/lib/catalog";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

const offers: Offer[] = [
  {
    id: "almond-cashew-launch",
    title: "Launch Combo",
    description: "Buy 1kg almonds and get 200g cashews free with your order.",
    expiryDate: "2026-06-30",
    discountCode: "DRYLAUNCH",
    extraItemText: "200g cashews free on 1kg almond orders",
    active: true,
    createdAt: new Date().toISOString()
  }
];

const initialData: StoreData = {
  users: [],
  addresses: [],
  products: defaultProducts,
  orders: [],
  offers,
  notifications: [],
  otps: {}
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as StoreData;
  const mergedProducts = [
    ...(parsed.products ?? []),
    ...defaultProducts.filter((defaultProduct) => !(parsed.products ?? []).some((product) => product.id === defaultProduct.id))
  ];
  return {
    ...initialData,
    ...parsed,
    addresses: parsed.addresses ?? [],
    products: mergedProducts.length ? mergedProducts : defaultProducts,
    offers: parsed.offers?.length ? parsed.offers : offers,
    notifications: parsed.notifications ?? [],
    otps: parsed.otps ?? {}
  };
}

export async function addSavedAddress(address: Omit<SavedAddress, "id" | "createdAt">): Promise<SavedAddress> {
  const store = await readStore();
  if (address.isDefault) {
    store.addresses.forEach((entry) => {
      if (entry.phone === address.phone) entry.isDefault = false;
    });
  }

  const entry: SavedAddress = {
    ...address,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  store.addresses.unshift(entry);
  await writeStore(store);
  return entry;
}

export async function updateSavedAddress(addressId: string, phone: string, updates: Partial<SavedAddress>): Promise<SavedAddress | null> {
  const store = await readStore();
  const address = store.addresses.find((entry) => entry.id === addressId && entry.phone === phone);
  if (!address) return null;

  if (updates.isDefault) {
    store.addresses.forEach((entry) => {
      if (entry.phone === phone) entry.isDefault = false;
    });
  }

  Object.assign(address, updates);
  await writeStore(store);
  return address;
}

export async function deleteSavedAddress(addressId: string, phone: string): Promise<boolean> {
  const store = await readStore();
  const address = store.addresses.find((entry) => entry.id === addressId && entry.phone === phone);
  if (!address) return false;
  if (address.isDefault) return false;

  store.addresses = store.addresses.filter((entry) => entry.id !== addressId);
  await writeStore(store);
  return true;
}

export async function writeStore(data: StoreData) {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

export async function upsertUser(phone: string, otpVerified: boolean): Promise<User> {
  const store = await readStore();
  const existing = store.users.find((user) => user.phone === phone);
  if (existing) {
    existing.otpVerified = otpVerified;
    await writeStore(store);
    return existing;
  }

  const user: User = { phone, otpVerified, createdAt: new Date().toISOString() };
  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function addOrder(order: Order): Promise<Order> {
  const store = await readStore();
  store.orders.unshift(order);
  await writeStore(store);
  return order;
}

export async function addNotification(notification: Omit<AppNotification, "id" | "createdAt" | "read">): Promise<AppNotification> {
  const store = await readStore();
  const entry: AppNotification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false
  };
  store.notifications.unshift(entry);
  await writeStore(store);
  return entry;
}

export async function markNotificationsRead(ids: string[]) {
  const store = await readStore();
  const idSet = new Set(ids);
  store.notifications.forEach((notification) => {
    if (idSet.has(notification.id)) notification.read = true;
  });
  await writeStore(store);
}

export async function addProduct(product: Product): Promise<Product> {
  const store = await readStore();
  store.products.unshift(product);
  await writeStore(store);
  return product;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  const store = await readStore();
  const product = store.products.find((entry) => entry.id === productId);
  if (!product) return null;

  Object.assign(product, updates);
  await writeStore(store);
  return product;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const store = await readStore();
  const beforeCount = store.products.length;
  store.products = store.products.filter((entry) => entry.id !== productId);
  if (store.products.length === beforeCount) return false;
  await writeStore(store);
  return true;
}

export async function updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer | null> {
  const store = await readStore();
  const offer = store.offers.find((entry) => entry.id === offerId);
  if (!offer) return null;

  Object.assign(offer, updates);
  await writeStore(store);
  return offer;
}

export async function deleteOffer(offerId: string): Promise<boolean> {
  const store = await readStore();
  const beforeCount = store.offers.length;
  store.offers = store.offers.filter((entry) => entry.id !== offerId);
  if (store.offers.length === beforeCount) return false;
  await writeStore(store);
  return true;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const store = await readStore();
  const order = store.orders.find((entry) => entry.id === orderId);
  if (!order) return null;
  order.status = status;
  await writeStore(store);
  return order;
}
