"use client";

import React, { useMemo } from "react";
import { useAdmin } from "../admin-context";

export default function AdminAnalyticsPage() {
  const { orders, products } = useAdmin();

  // Metrics
  const summary = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const completedOrders = orders.filter((o) => o.status === "delivered" || o.paymentStatus === "paid");
    const revenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrder = validOrders.length ? Math.round(revenue / validOrders.length) : 0;
    const cancelRate = orders.length ? Math.round((orders.filter(o => o.status === "cancelled").length / orders.length) * 100) : 0;

    return {
      revenue,
      avgOrder,
      cancelRate,
      totalOrders: orders.length,
      validOrdersCount: validOrders.length
    };
  }, [orders]);

  // Product sales logs
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      o.items.forEach((item) => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        counts[item.productId].quantity += item.quantity || 1;
        counts[item.productId].revenue += item.lineTotal || 0;
      });
    });

    return Object.entries(counts)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  // Payment methods popularity
  const paymentPopularity = useMemo(() => {
    let cod = 0;
    let upi = 0;
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      if (o.paymentMethod === "cash_on_delivery") cod++;
      else upi++;
    });
    const total = cod + upi || 1;
    return {
      codPercent: Math.round((cod / total) * 100),
      upiPercent: Math.round((upi / total) * 100)
    };
  }, [orders]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Business Analytics</h1>
        <p className="text-xs text-[#a5948b] mt-1">Deep analysis of customer acquisition costs, average transaction volume, and inventory velocity.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Fulfillment Revenue</p>
          <h3 className="text-2xl font-black text-[#dfb15b] mt-2">₹{summary.revenue.toLocaleString("en-IN")}</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Settled or Delivered accounts</p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Avg Order Value</p>
          <h3 className="text-2xl font-black text-white mt-2">₹{summary.avgOrder}</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Mean ticket size per cart</p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Orders Placed</p>
          <h3 className="text-2xl font-black text-emerald-500 mt-2">{summary.totalOrders}</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Lifetime total storefront attempts</p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase text-[#a5948b] tracking-wider">Cancellation Rate</p>
          <h3 className="text-2xl font-black text-red-400 mt-2">{summary.cancelRate}%</h3>
          <p className="text-[9px] text-[#a5948b]/60 mt-1">Ratio of cancelled order requests</p>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Products performance */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-widest">Velocity Leaderboard</h3>
          <div className="space-y-4 pt-2">
            {topProducts.map((p, idx) => (
              <div key={p.id} className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#dfb15b]/10 text-[#dfb15b] font-black flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white uppercase tracking-wider">{p.name}</h4>
                    <p className="text-[10px] text-[#a5948b] mt-0.5">{p.quantity} packages shipped</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#dfb15b]">₹{p.revenue.toLocaleString("en-IN")}</p>
                  <p className="text-[9px] text-[#a5948b]/60 mt-0.5">Gross Revenue</p>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <p className="text-xs text-[#a5948b] italic py-8 text-center">No catalog sales data compiled.</p>
            )}
          </div>
        </div>

        {/* Payment and funnel split */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
          <h3 className="text-sm font-black uppercase text-white tracking-widest">Payment Methods Split</h3>
          
          <div className="space-y-6 pt-2">
            {/* UPI Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white uppercase">
                <span>UPI Transfers</span>
                <span className="text-[#dfb15b]">{paymentPopularity.upiPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${paymentPopularity.upiPercent}%` }} 
                  className="bg-gradient-to-r from-[#dfb15b] to-[#c89b3c] h-full rounded-full" 
                />
              </div>
            </div>

            {/* COD Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white uppercase">
                <span>Cash On Delivery</span>
                <span className="text-emerald-500">{paymentPopularity.codPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${paymentPopularity.codPercent}%` }} 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 text-[11px] text-[#a5948b] leading-relaxed space-y-2 font-semibold">
            <p>💡 UPI payments represent lower processing risk and instant settlement.</p>
            <p>💡 Average order values generally increase by 12% on festive gift wrapping options.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
