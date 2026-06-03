import { promises as fs } from "fs";
import path from "path";
import type { 
  AppNotification, 
  CouponUsage, 
  Offer, 
  Order, 
  OrderStatus, 
  Product, 
  SavedAddress, 
  StoreData, 
  User,
  Address,
  OrderItem
} from "@/lib/types";
import { defaultProducts } from "@/lib/catalog";
import { supabase } from "./supabase";
import { isSupabaseConfigured } from "./supabase-config";

const seedStorePath = path.join(process.cwd(), "data", "store.json");
const dataDir = process.env.VERCEL ? path.join("/tmp", "pistabajar") : path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

const offers: Offer[] = [
  {
    id: "pista-launch-combo",
    title: "Grand Launch Combo",
    description: "Claim your launch offer! Buy 1kg Premium Almonds and get 250g Salted Pistachios absolutely free.",
    expiryDate: "2026-09-30",
    discountCode: "PISTALAUNCH",
    extraItemText: "250g free Pistachios on 1kg Almonds",
    autoAddItems: [
      { productId: "pista-salted", quantityKg: 0.25 }
    ],
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
  couponUsages: [],
  notifications: [],
  otps: {}
};

function normalizeAddressDefaults(addresses: SavedAddress[]) {
  const byPhone = new Map<string, SavedAddress[]>();
  addresses.forEach((address) => {
    const group = byPhone.get(address.phone) ?? [];
    group.push(address);
    byPhone.set(address.phone, group);
  });

  byPhone.forEach((group) => {
    let hasDefault = false;
    group.forEach((address) => {
      if (address.isDefault && !hasDefault) {
        hasDefault = true;
        return;
      }
      address.isDefault = false;
    });

    if (!hasDefault && group[0]) {
      group[0].isDefault = true;
    }
  });

  return addresses;
}

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    try {
      const seed = await fs.readFile(seedStorePath, "utf8");
      await fs.writeFile(storePath, seed, "utf8");
    } catch {
      await fs.writeFile(storePath, JSON.stringify(initialData, null, 2), "utf8");
    }
  }
}

// Read raw local store data from file
async function readLocalStore(): Promise<StoreData> {
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
    addresses: normalizeAddressDefaults(parsed.addresses ?? []),
    products: mergedProducts.length ? mergedProducts : defaultProducts,
    offers: parsed.offers?.length ? parsed.offers : offers,
    couponUsages: parsed.couponUsages ?? [],
    notifications: parsed.notifications ?? [],
    otps: parsed.otps ?? {}
  };
}

// Helper to resolve or create a user UUID in the USERS table from a phone number
async function resolveUserId(phone: string, name?: string): Promise<string> {
  const clean = phone.replace(/\D/g, "");
  const { data, error } = await supabase.from("USERS").select("id").eq("phone", clean).maybeSingle();
  if (error) {
    console.error("Supabase resolveUserId select error:", error.message);
  }
  if (data?.id) {
    return data.id;
  }
  const newId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("USERS").insert({
    id: newId,
    phone: clean,
    name: name || "Patron User",
    created_at: new Date().toISOString()
  });
  if (insertError) {
    console.error("Supabase resolveUserId insert error:", insertError.message);
  }
  return newId;
}

export async function readStore(): Promise<StoreData> {
  const local = await readLocalStore();
  
  if (!isSupabaseConfigured()) {
    return local;
  }

  try {
    const [productsRes, couponsRes, usersRes, addressesRes, ordersRes] = await Promise.all([
      supabase.from("PRODUCTS").select("*"),
      supabase.from("COUPONS").select("*"),
      supabase.from("USERS").select("*"),
      supabase.from("addresses").select("*"),
      supabase.from("ORDERS").select("*, order_items:ORDER_ITEMS(*)")
    ]);

    if (productsRes.error) throw productsRes.error;
    if (couponsRes.error) throw couponsRes.error;
    if (usersRes.error) throw usersRes.error;
    if (addressesRes.error) throw addressesRes.error;
    if (ordersRes.error) throw ordersRes.error;

    // Map USERS to Next.js User type
    const users: User[] = (usersRes.data || []).map((u: any) => ({
      phone: String(u.phone || ""),
      name: u.name || undefined,
      otpVerified: true,
      createdAt: u.created_at || new Date().toISOString()
    }));

    // Map PRODUCTS to Next.js Product type
    const products: Product[] = (productsRes.data || []).map((p: any) => ({
      id: String(p.id),
      name: p.name || "",
      imageUrl: p.image || p.imageUrl || "",
      price250g: Number(p.price_250g || 0),
      price500g: Number(p.price_500g || 0),
      price1kg: Number(p.price_1kg || 0),
      pricePerKg: Number(p.price_1kg || 0),
      category: p.category || "almonds",
      description: p.description || "",
      stockKg: Number(p.stock ?? 0),
      soldOut: Number(p.stock ?? 0) <= 0,
      featured: Boolean(p.featured),
      rating: Number(p.rating || 0.0)
    }));

    // Map COUPONS to Next.js Offer type
    const offersData: Offer[] = (couponsRes.data || []).map((c: any) => ({
      id: String(c.id),
      title: `Flat ${c.discount}% Special Coupon`,
      description: `Apply code ${c.code} to save ${c.discount}% on your organic nuts! Min order: ₹${c.minimum_order}.`,
      expiryDate: c.expiry_date || "",
      discountCode: c.code || "",
      active: Boolean(c.active),
      createdAt: c.created_at || new Date().toISOString()
    }));

    // Map addresses to Next.js SavedAddress type
    const addresses: SavedAddress[] = (addressesRes.data || []).map((a: any) => {
      const streetVal = a.house ? (a.area ? `${a.house}, ${a.area}` : a.house) : (a.address_line || "");
      const matchedUser = (usersRes.data || []).find((u: any) => u.id === a.user_id);
      const userPhone = matchedUser ? matchedUser.phone : (a.phone_number || "");
      return {
        id: String(a.id),
        phone: userPhone,
        name: a.full_name || matchedUser?.name || "Patron User",
        contactPhone: a.phone_number || userPhone,
        isDefault: Boolean(a.is_default),
        createdAt: a.created_at || new Date().toISOString(),
        addressLine: streetVal,
        city: a.city || "",
        pinCode: a.pincode || ""
      };
    });

    // Map ORDERS & ORDER_ITEMS to Next.js Order type
    const ordersData: Order[] = (ordersRes.data || []).map((o: any) => {
      const matchedUser = (usersRes.data || []).find((u: any) => u.id === o.user_id);
      const items: OrderItem[] = (o.order_items || []).map((item: any) => {
        const matchingProduct = products.find((p) => p.id === String(item.product_id));
        const selectedWeight = item.selected_weight || "1kg";
        const quantity = Number(item.quantity || 1.0);
        let quantityKg = quantity;
        if (selectedWeight === "250g") quantityKg = quantity * 0.25;
        else if (selectedWeight === "500g") quantityKg = quantity * 0.5;

        const pricePerKg = matchingProduct ? matchingProduct.price1kg : (item.subtotal && quantityKg ? Math.round(Number(item.subtotal) / quantityKg) : 0);

        return {
          productId: String(item.product_id),
          name: matchingProduct ? matchingProduct.name : "Organic Dry Fruits",
          quantityKg,
          pricePerKg,
          selectedWeight,
          quantity,
          lineTotal: Number(item.subtotal || 0)
        };
      });

      let resolvedAddress: Address = { addressLine: "", city: "", pinCode: "" };
      try {
        if (typeof o.address === "string") {
          resolvedAddress = JSON.parse(o.address);
        } else if (o.address && typeof o.address === "object") {
          resolvedAddress = o.address;
        }
      } catch (_) {}

      return {
        id: String(o.id),
        userName: o.userName || matchedUser?.name || undefined,
        userPhone: o.userPhone || matchedUser?.phone || "",
        address: resolvedAddress,
        items,
        subtotalAmount: Number(o.subtotal_amount || o.total_amount || 0),
        discountAmount: Number(o.discount_amount || 0),
        offerTitle: o.offer_title || undefined,
        totalAmount: Number(o.total_amount || 0),
        paymentMethod: o.payment_method || "upi",
        upiApp: o.upi_app || undefined,
        paymentStatus: o.payment_status || "pending",
        deliveryOtp: o.delivery_otp || undefined,
        status: o.order_status || "new",
        timestamp: o.created_at || new Date().toISOString()
      };
    });

      let notifications: AppNotification[] = local.notifications;
      try {
        const { data: notifData, error: notifError } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (!notifError && notifData) {
          notifications = notifData.map((n: any) => ({
            id: String(n.id),
            audience: n.audience || "admin",
            phone: n.phone || undefined,
            title: n.title || "",
            message: n.message || "",
            type: n.type || "product",
            icon: n.icon || undefined,
            deepLink: n.deepLink || undefined,
            createdAt: n.created_at || new Date().toISOString(),
            read: Boolean(n.read)
          }));
        }
      } catch (e) {
        console.warn("Supabase notifications fetch failed, using local storage fallback:", e);
      }

    return {
      users,
      addresses: normalizeAddressDefaults(addresses),
      products,
      orders: ordersData,
      offers: offersData,
      couponUsages: [],
      notifications,
      otps: local.otps
    };
  } catch (err) {
    console.error("Supabase readStore failed, falling back to local storage:", err);
    return local;
  }
}

export function getCouponUsageId(phone: string, offerId: string) {
  return `${phone}:${offerId}`;
}

export async function hasUsedCoupon(phone: string, offerId?: string, discountCode?: string): Promise<boolean> {
  if (!offerId && !discountCode) return false;
  if (!isSupabaseConfigured()) {
    const store = await readStore();
    return store.couponUsages.some(
      (entry) =>
        entry.phone === phone &&
        ((offerId && entry.offerId === offerId) || (discountCode && entry.discountCode?.toLowerCase() === discountCode.toLowerCase()))
    );
  }
  try {
    const userId = await resolveUserId(phone);
    let couponId = offerId;
    if (!couponId && discountCode) {
      const { data } = await supabase.from("COUPONS").select("id").eq("code", discountCode).maybeSingle();
      if (data?.id) couponId = data.id;
    }
    if (!couponId) return false;

    const { data } = await supabase
      .from("USER_COUPON_USAGE")
      .select("user_id")
      .eq("user_id", userId)
      .eq("coupon_id", couponId)
      .maybeSingle();

    return Boolean(data);
  } catch (err) {
    console.error("Supabase hasUsedCoupon query failed:", err);
    return false;
  }
}

export async function addCouponUsage(usage: Omit<CouponUsage, "id" | "usedAt">): Promise<CouponUsage | null> {
  if (await hasUsedCoupon(usage.phone, usage.offerId, usage.discountCode)) return null;

  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const entry: CouponUsage = {
      ...usage,
      id: getCouponUsageId(usage.phone, usage.offerId),
      usedAt: new Date().toISOString()
    };
    store.couponUsages.unshift(entry);
    await writeStore(store);
    return entry;
  }

  try {
    const userId = await resolveUserId(usage.phone);
    const { error } = await supabase.from("USER_COUPON_USAGE").insert({
      user_id: userId,
      coupon_id: usage.offerId,
      used_at: new Date().toISOString()
    });
    if (error) throw error;
    
    return {
      ...usage,
      id: getCouponUsageId(usage.phone, usage.offerId),
      usedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Supabase addCouponUsage failed:", err);
    return null;
  }
}

export async function addSavedAddress(address: Omit<SavedAddress, "id" | "createdAt">): Promise<SavedAddress> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const hasExistingForPhone = store.addresses.some((entry) => entry.phone === address.phone);
    const shouldBeDefault = address.isDefault || !hasExistingForPhone;

    if (shouldBeDefault) {
      store.addresses.forEach((entry) => {
        if (entry.phone === address.phone) entry.isDefault = false;
      });
    }

    const entry: SavedAddress = {
      ...address,
      isDefault: shouldBeDefault,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    store.addresses.unshift(entry);
    await writeStore(store);
    return entry;
  }

  try {
    const userId = await resolveUserId(address.phone, address.name);
    const newId = crypto.randomUUID();
    const { data: existing } = await supabase.from("addresses").select("id").eq("user_id", userId);
    const shouldBeDefault = address.isDefault || !existing?.length;

    if (shouldBeDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }

    const addressLine = address.addressLine;
    const commaIndex = addressLine.indexOf(",");
    const house = commaIndex !== -1 ? addressLine.substring(0, commaIndex).trim() : addressLine.trim();
    const area = commaIndex !== -1 ? addressLine.substring(commaIndex + 1).trim() : "";

    const { error } = await supabase.from("addresses").insert({
      id: newId,
      user_id: userId,
      full_name: address.name,
      phone_number: address.contactPhone,
      house,
      area,
      city: address.city,
      pincode: address.pinCode,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    return {
      ...address,
      isDefault: shouldBeDefault,
      id: newId,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Supabase addSavedAddress failed:", err);
    throw err;
  }
}

export async function updateSavedAddress(addressId: string, phone: string, updates: Partial<SavedAddress>): Promise<SavedAddress | null> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
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

  try {
    const userId = await resolveUserId(phone);
    if (updates.isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };
    if (updates.name) dbUpdates.full_name = updates.name;
    if (updates.contactPhone) dbUpdates.phone_number = updates.contactPhone;
    if (updates.city) dbUpdates.city = updates.city;
    if (updates.pinCode) dbUpdates.pincode = updates.pinCode;
    if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;

    if (updates.addressLine) {
      const commaIndex = updates.addressLine.indexOf(",");
      dbUpdates.house = commaIndex !== -1 ? updates.addressLine.substring(0, commaIndex).trim() : updates.addressLine.trim();
      dbUpdates.area = commaIndex !== -1 ? updates.addressLine.substring(commaIndex + 1).trim() : "";
    }

    const { error } = await supabase
      .from("addresses")
      .update(dbUpdates)
      .eq("id", addressId)
      .eq("user_id", userId);

    if (error) throw error;

    const store = await readStore();
    return store.addresses.find((a) => a.id === addressId) || null;
  } catch (err) {
    console.error("Supabase updateSavedAddress failed:", err);
    return null;
  }
}

export async function deleteSavedAddress(addressId: string, phone: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const address = store.addresses.find((entry) => entry.id === addressId && entry.phone === phone);
    if (!address) return false;

    store.addresses = store.addresses.filter((entry) => entry.id !== addressId);
    if (address.isDefault) {
      const nextDefault = store.addresses.find((entry) => entry.phone === phone);
      if (nextDefault) nextDefault.isDefault = true;
    }
    await writeStore(store);
    return true;
  }

  try {
    const userId = await resolveUserId(phone);
    
    // Check if the deleted address is default
    const { data: address } = await supabase
      .from("addresses")
      .select("is_default")
      .eq("id", addressId)
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    if (error) throw error;

    if (address?.is_default) {
      const { data: fallbackAddress } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (fallbackAddress) {
        await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", fallbackAddress.id);
      }
    }

    return true;
  } catch (err) {
    console.error("Supabase deleteSavedAddress failed:", err);
    return false;
  }
}

export async function writeStore(data: StoreData) {
  // Writes are only done locally for notifications and otps, keeping compatibility
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

export async function upsertUser(phone: string, otpVerified: boolean, name?: string): Promise<User> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const existing = store.users.find((user) => user.phone === phone);
    const cleanName = name?.trim();
    if (existing) {
      if (cleanName) existing.name = cleanName;
      existing.otpVerified = otpVerified;
      await writeStore(store);
      return existing;
    }

    const user: User = { phone, name: cleanName, otpVerified, createdAt: new Date().toISOString() };
    store.users.push(user);
    await writeStore(store);
    return user;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const { data: existing, error } = await supabase
      .from("USERS")
      .select("*")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (error) throw error;

    const cleanName = name?.trim();

    if (existing) {
      if (cleanName && existing.name !== cleanName) {
        await supabase
          .from("USERS")
          .update({ name: cleanName })
          .eq("phone", cleanPhone);
      }
      return {
        phone: cleanPhone,
        name: cleanName || existing.name || undefined,
        otpVerified: true,
        createdAt: existing.created_at || new Date().toISOString()
      };
    } else {
      const newId = crypto.randomUUID();
      await supabase.from("USERS").insert({
        id: newId,
        phone: cleanPhone,
        name: cleanName || "Patron User",
        created_at: new Date().toISOString()
      });

      return {
        phone: cleanPhone,
        name: cleanName || "Patron User",
        otpVerified: true,
        createdAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.error("Supabase upsertUser failed:", err);
    throw err;
  }
}

export async function addOrder(order: Order): Promise<Order> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    store.orders.unshift(order);
    await writeStore(store);
    return order;
  }

  try {
    const userId = await resolveUserId(order.userPhone, order.userName);
    
    // Insert header order into ORDERS table
    const { error: orderError } = await supabase.from("ORDERS").insert({
      id: order.id,
      user_id: userId,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      order_status: order.status,
      address: order.address, // JSON field serializes automatically
      created_at: order.timestamp,
      subtotal_amount: order.subtotalAmount,
      discount_amount: order.discountAmount,
      offer_title: order.offerTitle,
      payment_status: order.paymentStatus || "pending",
      delivery_otp: order.deliveryOtp
    });

    if (orderError) throw orderError;

    // Map order items to insert query format
    const dbItems = order.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      selected_weight: item.selectedWeight,
      subtotal: item.lineTotal
    }));

    const { error: itemsError } = await supabase.from("ORDER_ITEMS").insert(dbItems);
    if (itemsError) throw itemsError;

    return order;
  } catch (err) {
    console.error("Supabase addOrder failed:", err);
    throw err;
  }
}

export async function addNotification(notification: Omit<AppNotification, "id" | "createdAt" | "read">): Promise<AppNotification> {
  const entry: AppNotification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("notifications").insert({
        id: entry.id,
        title: entry.title,
        message: entry.message,
        type: entry.type,
        created_at: entry.createdAt,
        read: entry.read
      });
      if (!error) return entry;
      console.warn("Supabase notifications insert failed, falling back to local storage:", error.message);
    } catch (err) {
      console.warn("Supabase notifications insert error, falling back to local storage:", err);
    }
  }

  const store = await readLocalStore();
  store.notifications.unshift(entry);
  await writeStore(store);
  return entry;
}

export async function markNotificationsRead(ids: string[]) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", ids);
      if (!error) return;
      console.warn("Supabase markNotificationsRead failed, falling back to local storage:", error.message);
    } catch (err) {
      console.warn("Supabase markNotificationsRead error, falling back to local storage:", err);
    }
  }

  const store = await readLocalStore();
  const idSet = new Set(ids);
  store.notifications.forEach((notification) => {
    if (idSet.has(notification.id)) notification.read = true;
  });
  await writeStore(store);
}

export async function addProduct(product: Product): Promise<Product> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    store.products.unshift(product);
    await writeStore(store);
    return product;
  }

  try {
    const { error } = await supabase.from("PRODUCTS").insert({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.imageUrl,
      category: product.category,
      stock: product.stockKg ?? 100.0,
      price_250g: product.price250g,
      price_500g: product.price500g,
      price_1kg: product.price1kg,
      featured: Boolean(product.featured),
      rating: product.rating ?? 5.0
    });
    if (error) throw error;
    return product;
  } catch (err) {
    console.error("Supabase addProduct failed:", err);
    throw err;
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const product = store.products.find((entry) => entry.id === productId);
    if (!product) return null;

    Object.assign(product, updates);
    await writeStore(store);
    return product;
  }

  try {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.imageUrl) dbUpdates.image = updates.imageUrl;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.stockKg !== undefined) dbUpdates.stock = updates.stockKg;
    if (updates.price250g !== undefined) dbUpdates.price_250g = updates.price250g;
    if (updates.price500g !== undefined) dbUpdates.price_500g = updates.price500g;
    if (updates.price1kg !== undefined) dbUpdates.price_1kg = updates.price1kg;
    if (updates.pricePerKg !== undefined) dbUpdates.price_1kg = updates.pricePerKg;
    if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;

    const { error } = await supabase
      .from("PRODUCTS")
      .update(dbUpdates)
      .eq("id", productId);

    if (error) throw error;

    const store = await readStore();
    return store.products.find((p) => p.id === productId) || null;
  } catch (err) {
    console.error("Supabase updateProduct failed:", err);
    return null;
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const beforeCount = store.products.length;
    store.products = store.products.filter((entry) => entry.id !== productId);
    if (store.products.length === beforeCount) return false;
    await writeStore(store);
    return true;
  }

  try {
    const { error } = await supabase.from("PRODUCTS").delete().eq("id", productId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase deleteProduct failed:", err);
    return false;
  }
}

export async function updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer | null> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const offer = store.offers.find((entry) => entry.id === offerId);
    if (!offer) return null;

    Object.assign(offer, updates);
    await writeStore(store);
    return offer;
  }

  try {
    const dbUpdates: any = {};
    if (updates.discountCode) dbUpdates.code = updates.discountCode;
    if (updates.expiryDate) dbUpdates.expiry_date = updates.expiryDate;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    // Map minimal discount details if present
    if (updates.description) {
      const match = updates.description.match(/save (\d+)%/);
      if (match?.[1]) dbUpdates.discount = parseInt(match[1]);
    }

    const { error } = await supabase
      .from("COUPONS")
      .update(dbUpdates)
      .eq("id", offerId);

    if (error) throw error;

    const store = await readStore();
    return store.offers.find((o) => o.id === offerId) || null;
  } catch (err) {
    console.error("Supabase updateOffer failed:", err);
    return null;
  }
}

export async function deleteOffer(offerId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const beforeCount = store.offers.length;
    store.offers = store.offers.filter((entry) => entry.id !== offerId);
    if (store.offers.length === beforeCount) return false;
    await writeStore(store);
    return true;
  }

  try {
    const { error } = await supabase.from("COUPONS").delete().eq("id", offerId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase deleteOffer failed:", err);
    return false;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status?: OrderStatus,
  paymentStatus?: "pending" | "paid"
): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    const store = await readLocalStore();
    const order = store.orders.find((entry) => entry.id === orderId);
    if (!order) return null;
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await writeStore(store);
    return order;
  }

  try {
    const dbUpdates: any = {};
    if (status) dbUpdates.order_status = status;
    if (paymentStatus) dbUpdates.payment_status = paymentStatus;

    const { error } = await supabase
      .from("ORDERS")
      .update(dbUpdates)
      .eq("id", orderId);

    if (error) throw error;

    const store = await readStore();
    return store.orders.find((o) => o.id === orderId) || null;
  } catch (err) {
    console.error("Supabase updateOrderStatus failed:", err);
    return null;
  }
}
