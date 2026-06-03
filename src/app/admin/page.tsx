"use client";

import React, { useMemo } from "react";
import { useAdmin } from "./admin-context";
import Link from "next/link";

export default function AdminDashboardOverview() {
  const { orders, products, offers, notifications } = useAdmin();

  // Compute metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "delivered" || o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === "new").length;
  }, [orders]);

  const totalSalesCount = useMemo(() => {
    return orders.filter((o) => o.status !== "cancelled").length;
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  const recentAlerts = useMemo(() => {
    return notifications.slice(0, 6);
  }, [notifications]);

  // Categories count
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [products]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Dashboard Overview</h1>
          <p className="text-xs text-[#a5948b] mt-1">Real-time storefront metrics and operations logs.</p>
        </div>
        <div className="text-xs text-[#dfb15b] font-extrabold bg-[#dfb15b]/10 border border-[#dfb15b]/20 px-4 py-2 rounded-xl">
          🟢 SECURE BACKEND CONSOLE SYNCED
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-2xl">💰</div>
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Total Revenue</p>
          <h3 className="text-2xl font-black text-[#dfb15b] mt-2">₹{totalRevenue.toLocaleString("en-IN")}</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Excludes cancelled & unpaid orders</p>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-2xl">📦</div>
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Total Orders</p>
          <h3 className="text-2xl font-black text-white mt-2">{totalSalesCount}</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Includes pending, shipping & completed</p>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-2xl">⏳</div>
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Pending Orders</p>
          <h3 className="text-2xl font-black text-amber-500 mt-2">{pendingOrders}</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Orders waiting packaging or delivery</p>
        </div>

        {/* Card 4: Inventory */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-2xl">🥜</div>
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Active Catalog</p>
          <h3 className="text-2xl font-black text-emerald-500 mt-2">{products.length} Items</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Across {categoryStats.length} major categories</p>
        </div>
      </div>

      {/* Visual Analytics Chart & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">Order Volume Trends</h3>
            <span className="text-[9px] text-emerald-500 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Real-time</span>
          </div>

          <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 relative border-b border-white/5 border-l">
            {/* Y-axis gridlines */}
            <div className="absolute left-0 right-0 top-0 border-t border-white/[0.03] text-[8px] text-[#a5948b]/40 pl-2">Peak</div>
            <div className="absolute left-0 right-0 top-1/2 border-t border-white/[0.03] text-[8px] text-[#a5948b]/40 pl-2">Mid</div>

            {/* Simple visual mock graph representing weekly order density */}
            {[20, 45, 30, 80, 55, 90, 75].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div 
                  style={{ height: `${val}%` }} 
                  className="w-full bg-gradient-to-t from-[#40753b]/40 to-[#dfb15b] rounded-t-lg transition-all duration-500 group-hover:brightness-125 min-h-[4px]"
                />
                <span className="text-[8px] text-[#a5948b] uppercase tracking-wider font-extrabold mt-1">Day {idx+1}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-[105%] bg-black text-[#dfb15b] border border-white/10 rounded px-2 py-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                  {val}% Density
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-black uppercase text-white tracking-widest">Top Selling Ranges</h3>
          <div className="space-y-4 pt-2">
            {categoryStats.map(([cat, count], idx) => {
              const percentages = [65, 45, 35];
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-white uppercase">
                    <span className="text-xs">{cat}</span>
                    <span className="text-[#dfb15b] text-[10px]">{count} products</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percentages[idx] || 25}%` }} 
                      className="bg-[#dfb15b] h-full rounded-full" 
                    />
                  </div>
                </div>
              );
            })}
            {categoryStats.length === 0 && (
              <p className="text-xs text-[#a5948b] italic">No products added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Operations Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">Recent Placed Orders</h3>
            <Link href="/admin/orders" className="text-[10px] text-[#dfb15b] font-extrabold hover:underline uppercase tracking-wide">
              Manage all ↗
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {recentOrders.map((o) => (
              <div key={o.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-white">{o.userName || o.userPhone}</p>
                  <p className="text-[9px] text-[#a5948b] mt-0.5 uppercase">
                    ID: {o.id.slice(0, 8)} · {o.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#dfb15b]">₹{o.totalAmount}</p>
                  <span className={`inline-block text-[8px] px-2 py-0.5 rounded font-black uppercase mt-1 ${
                    o.status === "new" ? "bg-amber-500/10 text-amber-500" :
                    o.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" :
                    o.status === "cancelled" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-xs text-[#a5948b] italic py-4 text-center">No orders available yet.</p>
            )}
          </div>
        </div>

        {/* Live Admin notifications log */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">System Alerts Feed</h3>
            <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-black">Live</span>
          </div>

          <div className="space-y-3">
            {recentAlerts.map((a) => (
              <div key={a.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[9px] font-black uppercase text-[#a5948b]">
                  <span className={a.type === "order_placed" ? "text-[#dfb15b]" : "text-emerald-500"}>
                    {a.type.replace("_", " ")}
                  </span>
                  <span>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{a.title}</h4>
                <p className="text-[10px] text-[#a5948b] leading-relaxed">{a.message}</p>
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <p className="text-xs text-[#a5948b] italic py-4 text-center">No active notifications logs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
