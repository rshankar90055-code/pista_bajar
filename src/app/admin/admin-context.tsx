"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Order, Product, Offer, AppNotification, OrderStatus } from "@/lib/types";

interface AdminContextProps {
  isAuthed: boolean;
  password: string;
  orders: Order[];
  products: Product[];
  offers: Offer[];
  notifications: AppNotification[];
  loadOrders: (nextPassword?: string) => Promise<boolean>;
  loadProducts: () => Promise<void>;
  loadOffers: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  verifyUpiPayment: (orderId: string) => Promise<void>;
  sendToShiprocket: (order: Order) => Promise<void>;
  createProduct: (productData: any) => Promise<boolean>;
  updateProductDetails: (productId: string, productData: any) => Promise<boolean>;
  deleteProductDetails: (productId: string) => Promise<boolean>;
  createOfferDetails: (offerData: any) => Promise<boolean>;
  updateOfferDetails: (offerId: string, offerData: any) => Promise<boolean>;
  deleteOfferDetails: (offerId: string) => Promise<boolean>;
  login: (pass: string) => Promise<boolean>;
  logout: () => void;
  toast: string;
  setToast: (msg: string) => void;
  showToast: (msg: string) => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [seenAdminNotificationIds, setSeenAdminNotificationIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  // Recover session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("pista_admin_password");
    if (saved) {
      void login(saved);
    }
  }, []);

  async function pollAdminNotifications(pass = password) {
    if (!pass) return;
    try {
      const response = await fetch(`/api/notifications?audience=admin&adminPassword=${encodeURIComponent(pass)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { notifications?: AppNotification[] };
      const fetched = data.notifications ?? [];
      setNotifications(fetched);

      const unread = fetched.filter((entry) => !entry.read && !seenAdminNotificationIds.has(entry.id));
      if (!unread.length) return;

      setSeenAdminNotificationIds((current) => new Set([...current, ...unread.map((entry) => entry.id)]));
      const latest = unread[0];
      showToast(`${latest.title}: ${latest.message} 🔔`);
      
      // Mark read
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unread.map((entry) => entry.id) })
      });
    } catch (e) {
      console.warn("Error polling notifications:", e);
    }
  }

  useEffect(() => {
    if (!isAuthed || !password) return;
    void pollAdminNotifications(password);
    const interval = window.setInterval(() => pollAdminNotifications(password), 8000);
    return () => window.clearInterval(interval);
  }, [isAuthed, password, seenAdminNotificationIds]);

  async function login(pass: string): Promise<boolean> {
    try {
      const ok = await loadOrders(pass);
      if (ok) {
        setPassword(pass);
        setIsAuthed(true);
        sessionStorage.setItem("pista_admin_password", pass);
        await Promise.all([loadProducts(), loadOffers()]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function logout() {
    setPassword("");
    setIsAuthed(false);
    sessionStorage.removeItem("pista_admin_password");
    setOrders([]);
    setProducts([]);
    setOffers([]);
  }

  async function loadOrders(nextPassword = password): Promise<boolean> {
    try {
      const response = await fetch(`/api/orders?adminPassword=${encodeURIComponent(nextPassword)}`);
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "Authentication failed.");
        return false;
      }
      setOrders(data.orders ?? []);
      return true;
    } catch {
      showToast("Connection error while loading orders.");
      return false;
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.products ?? []);
    } catch {
      console.error("Failed to load products");
    }
  }

  async function loadOffers() {
    try {
      const response = await fetch("/api/offers?includeInactive=true");
      const data = await response.json();
      setOffers(data.offers ?? []);
    } catch {
      console.error("Failed to load offers");
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "Update status failed");
        return;
      }
      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      showToast("Order status updated.");
    } catch {
      showToast("Network error updating status.");
    }
  }

  async function verifyUpiPayment(orderId: string) {
    try {
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus: "paid", adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "Verify payment failed");
        return;
      }
      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      showToast("UPI Payment verified & marked as paid.");
    } catch {
      showToast("Network error verifying payment.");
    }
  }

  async function sendToShiprocket(order: Order) {
    try {
      const response = await fetch("/api/shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, order })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Shiprocket pickup request failed.");
        return;
      }
      showToast(data.message || "Sent to Shiprocket successfully.");
      await updateOrderStatus(order.id, "shiprocket_pickup");
    } catch {
      showToast("Network error communicating with Shiprocket.");
    }
  }

  async function createProduct(productData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productData, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to create product.");
        return false;
      }
      showToast(`Product added: ${data.product.name}`);
      await loadProducts();
      return true;
    } catch {
      showToast("Network error adding product.");
      return false;
    }
  }

  async function updateProductDetails(productId: string, productData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...productData, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to update product.");
        return false;
      }
      setProducts((current) => current.map((entry) => (entry.id === productId ? data.product : entry)));
      showToast(`Product updated: ${data.product.name}`);
      return true;
    } catch {
      showToast("Network error updating product.");
      return false;
    }
  }

  async function deleteProductDetails(productId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to delete product.");
        return false;
      }
      setProducts((current) => current.filter((entry) => entry.id !== productId));
      showToast("Product deleted.");
      return true;
    } catch {
      showToast("Network error deleting product.");
      return false;
    }
  }

  async function createOfferDetails(offerData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/create-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...offerData, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to create coupon.");
        return false;
      }
      showToast(`Coupon created: ${data.offer?.title}`);
      await loadOffers();
      return true;
    } catch {
      showToast("Network error adding coupon.");
      return false;
    }
  }

  async function updateOfferDetails(offerId: string, offerData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/update-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, ...offerData, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to update coupon.");
        return false;
      }
      setOffers((current) => current.map((entry) => (entry.id === offerId ? data.offer : entry)));
      showToast(`Coupon updated: ${data.offer?.title}`);
      return true;
    } catch {
      showToast("Network error updating coupon.");
      return false;
    }
  }

  async function deleteOfferDetails(offerId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/delete-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, adminPassword: password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to delete coupon.");
        return false;
      }
      setOffers((current) => current.filter((entry) => entry.id !== offerId));
      showToast("Coupon deleted.");
      return true;
    } catch {
      showToast("Network error deleting coupon.");
      return false;
    }
  }

  return (
    <AdminContext.Provider
      value={{
        isAuthed,
        password,
        orders,
        products,
        offers,
        notifications,
        loadOrders,
        loadProducts,
        loadOffers,
        updateOrderStatus,
        verifyUpiPayment,
        sendToShiprocket,
        createProduct,
        updateProductDetails,
        deleteProductDetails,
        createOfferDetails,
        updateOfferDetails,
        deleteOfferDetails,
        login,
        logout,
        toast,
        setToast,
        showToast
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
