"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("druits_phone") ?? "";
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
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Order cancelled", {
        body: "Your order has been cancelled successfully."
      });
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">D</span>
          <span>Druits</span>
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
                  Payment: {order.paymentMethod?.replaceAll("_", " ") ?? "Not selected"} · {order.paymentStatus ?? "pending"}
                </p>
                <p className="muted">
                  Delivery: {order.address.addressLine}, {order.address.city} {order.address.pinCode}
                </p>
                {order.status === "new" ? (
                  <button className="button danger" type="button" onClick={() => cancelOrder(order.id)}>
                    Cancel order
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
