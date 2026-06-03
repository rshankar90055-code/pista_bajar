"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("pistabajar_phone") ?? "";
    setPhone(savedPhone);
    if (savedPhone) void loadOrders(savedPhone);
  }, []);

  async function loadOrders(nextPhone = phone) {
    if (!nextPhone) return;
    const response = await fetch(`/api/my-orders?phone=${encodeURIComponent(nextPhone)}`);
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not load orders.");
      return;
    }
    setOrders(data.orders ?? []);
  }

  async function cancelOrder(orderId: string) {
    if (!phone || cancellingOrderId) return;
    setCancellingOrderId(orderId);

    try {
      const response = await fetch("/api/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone })
      });
      const data = await response.json();
      if (!response.ok) {
        setToast(data.error ?? "Could not cancel order.");
        return;
      }
      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      setToast("Order cancelled.");
    } catch {
      setToast("Could not cancel order. Please check your connection and try again.");
    } finally {
      setCancellingOrderId("");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" style={{ background: 'linear-gradient(135deg, #dfb15b, #b88d3d)', borderRadius: '8px', color: '#1c130f', fontWeight: 'bold', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
            <img src="/pistabajar-logo.png" alt="P" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </span>
          <span>Pista Bajar</span>
        </a>
        <a className="button ghost" href="/">
          Shop
        </a>
      </header>

      <section className="panel">
        <div className="section-head">
          <div>
            <h1>Orders</h1>
            <p className="muted">{phone ? `Orders for ${phone}` : "Login on the storefront to view your orders."}</p>
          </div>
          {phone ? (
            <button className="button ghost" type="button" onClick={() => loadOrders()}>
              Refresh
            </button>
          ) : null}
        </div>

        <div className="admin-table">
          {orders.length ? (
            orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="section-head">
                  <div>
                    <strong>₹{order.totalAmount}</strong>
                    <p className="muted">{new Date(order.timestamp).toLocaleString()}</p>
                  </div>
                  <span className="status">{order.status.replaceAll("_", " ")}</span>
                </div>
                <div>
                  {order.items.map((item) => (
                    <p className="muted" key={`${order.id}-${item.productId}`}>
                      {item.name}: {item.quantityKg}kg · ₹{item.lineTotal}
                    </p>
                  ))}
                </div>
                {order.discountCode ? (
                  <p className="coupon-line">
                    Coupon used: {order.discountCode}
                    {order.offerTitle ? ` · ${order.offerTitle}` : ""} · Saved ₹{order.discountAmount ?? 0}
                  </p>
                ) : (
                  <p className="muted">No coupon used</p>
                )}
                <p className="muted">
                  Payment: {order.paymentMethod?.replaceAll("_", " ") ?? "Not selected"}
                  {order.upiApp ? ` (${order.upiApp === "gpay" ? "GPay" : "PhonePe"})` : ""} · {order.paymentStatus ?? "pending"}
                </p>
                <p className="muted">
                  Delivery: {order.address.addressLine}, {order.address.city} {order.address.pinCode}
                </p>
                {order.status === "new" ? (
                  <button className="button danger" type="button" onClick={() => cancelOrder(order.id)} disabled={cancellingOrderId === order.id}>
                    {cancellingOrderId === order.id ? "Cancelling..." : "Cancel order"}
                  </button>
                ) : null}
              </article>
            ))
          ) : (
            <p className="muted">No orders yet.</p>
          )}
        </div>
      </section>

      {toast ? (
        <div className="toast" role="status">
          {toast}
          <button className="button ghost" type="button" onClick={() => setToast("")}>
            Close
          </button>
        </div>
      ) : null}
    </main>
  );
}
