"use client";

import React, { useState } from "react";
import { useAdmin } from "../admin-context";
import type { Order, OrderStatus } from "@/lib/types";

const statusLabels: Record<OrderStatus, string> = {
  new: "New/Pending",
  cancelled: "Cancelled",
  shiprocket_pickup: "Picked up by Shiprocket",
  delivered: "Delivered"
};

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, verifyUpiPayment, sendToShiprocket, loadOrders } = useAdmin();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    const matchesSearch = 
      o.userPhone.includes(searchTerm) || 
      (o.userName && o.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Orders Hub</h1>
          <p className="text-xs text-[#a5948b] mt-1">Review orders, manage fulfillment logistics, verify UPI receipts.</p>
        </div>
        <button
          onClick={() => void loadOrders()}
          className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl border border-white/10 transition-colors uppercase self-start"
        >
          🔄 Refresh Orders List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by customer phone, name, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 px-4 pl-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 text-xs font-semibold focus:outline-none focus:border-[#dfb15b]"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
        </div>

        <div className="flex gap-2">
          {["all", "new", "shiprocket_pickup", "delivered", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`py-2 px-3.5 rounded-xl text-[10px] font-black uppercase border transition ${
                filterStatus === st
                  ? "bg-[#dfb15b] text-[#1c130f] border-[#dfb15b]"
                  : "bg-white/[0.02] text-[#a5948b] border-white/10 hover:text-white"
              }`}
            >
              {st === "all" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <article 
            key={order.id} 
            className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all space-y-4"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white/5 text-[#a5948b] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    ID: {order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                    order.status === "new" ? "bg-amber-500/10 text-amber-500" :
                    order.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" :
                    order.status === "cancelled" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-white mt-2">
                  {order.userName || "Guest Customer"} <span className="text-[#a5948b] font-normal">({order.userPhone})</span>
                </h3>
                <p className="text-xs text-[#a5948b] mt-1 leading-relaxed">
                  📍 {order.address.addressLine}, {order.address.city} - {order.address.pinCode}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] text-[#a5948b] uppercase tracking-wider">Ordered On</p>
                <p className="text-xs font-semibold text-white mt-1">
                  {new Date(order.timestamp).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-[#a5948b] uppercase tracking-widest">Ordered Selections</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl p-3 text-xs">
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-[#a5948b] mt-0.5">
                        Size: {item.selectedWeight || "1kg"} × Qty: {item.quantity || 1}
                      </p>
                    </div>
                    <p className="font-extrabold text-[#dfb15b]">₹{item.lineTotal}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gifting details */}
            {order.isGift && (
              <div className="bg-[#dfb15b]/5 border-l-2 border-[#dfb15b] p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-black text-[#dfb15b] uppercase tracking-widest block">🎁 Festive Gift Selection</span>
                {order.giftWrap && (
                  <span className="inline-block text-[9px] bg-[#dfb15b] text-[#1c130f] px-2 py-0.5 rounded font-black uppercase mt-1">
                    Premium Gold-Foil Festive wrap
                  </span>
                )}
                {order.giftNote && (
                  <p className="text-xs text-[#e3ded9] italic mt-1.5 leading-relaxed bg-black/20 p-2.5 rounded-lg">
                    &ldquo;{order.giftNote}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* UPI Screenshot view */}
            {order.paymentMethod === "upi" && order.upiScreenshot && (
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-[#a5948b] uppercase tracking-widest block">Payment Verification receipt</span>
                <img
                  src={order.upiScreenshot}
                  alt="UPI Receipt"
                  className="max-w-[120px] rounded-lg border border-white/10 hover:scale-105 transition cursor-zoom-in shadow-md"
                  onClick={() => {
                    const w = window.open();
                    if (w) w.document.write(`<img src="${order.upiScreenshot}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                  }}
                />
              </div>
            )}

            {/* Price Calculations Summary */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-xs">
              <div className="space-y-1">
                <p className="text-[#a5948b]">
                  Payment Mode: <strong className="text-white uppercase">{order.paymentMethod?.replace("_", " ")}</strong>
                  {order.upiApp ? ` (${order.upiApp.toUpperCase()})` : ""}
                </p>
                <p className="text-[#a5948b]">
                  Payment Status:{" "}
                  <span className={`font-extrabold uppercase ${order.paymentStatus === "paid" ? "text-emerald-500" : "text-amber-500"}`}>
                    {order.paymentStatus || "pending"}
                  </span>
                </p>
                {order.discountCode && (
                  <p className="text-xs text-[#dfb15b] font-semibold">
                    🎟️ Coupon: {order.discountCode} (Saved ₹{order.discountAmount || 0})
                  </p>
                )}
              </div>

              <div className="sm:text-right">
                <p className="text-[9px] text-[#a5948b] uppercase tracking-wider">Total Paid Amount</p>
                <p className="text-lg font-black text-[#dfb15b] mt-0.5">₹{order.totalAmount}</p>
              </div>
            </div>

            {/* Order Fulfillment Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {order.paymentMethod === "upi" && order.paymentStatus !== "paid" && (
                <button
                  onClick={() => void verifyUpiPayment(order.id)}
                  className="bg-[#dfb15b] text-[#1c130f] hover:bg-[#c89b3c] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                >
                  ✨ Verify UPI payment
                </button>
              )}
              
              <button
                onClick={() => void sendToShiprocket(order)}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
              >
                🚀 Send to Shiprocket
              </button>

              <div className="ml-auto flex items-center gap-2">
                <label className="text-[9px] font-black uppercase text-[#a5948b] tracking-wider">Fulfillment State:</label>
                <select
                  value={order.status}
                  onChange={(e) => void updateOrderStatus(order.id, e.target.value as OrderStatus)}
                  className="bg-[#091a10] border border-white/10 text-white rounded-xl text-[10px] font-black uppercase px-3 py-2 outline-none focus:border-[#dfb15b]"
                >
                  <option value="new">Pending</option>
                  <option value="shiprocket_pickup">Shipped (Mock)</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </article>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 text-center text-[#a5948b] space-y-3">
            <span className="text-4xl">📦</span>
            <p className="text-sm font-semibold">No orders matched the selected filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
