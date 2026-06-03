"use client";

import React, { useMemo, useState } from "react";
import { useAdmin } from "../admin-context";

interface CustomerProfile {
  phone: string;
  name: string;
  totalSpent: number;
  ordersCount: number;
  addresses: string[];
  orders: Array<{ id: string; timestamp: string; totalAmount: number; status: string }>;
}

export default function AdminCustomersPage() {
  const { orders } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Group orders by customer phone to build profiles
  const customers = useMemo(() => {
    const profiles: Record<string, CustomerProfile> = {};

    orders.forEach((o) => {
      const phone = o.userPhone.replace(/\D/g, "");
      if (!phone) return;

      const addressStr = `${o.address.addressLine}, ${o.address.city} - ${o.address.pinCode}`;

      if (!profiles[phone]) {
        profiles[phone] = {
          phone: o.userPhone,
          name: o.userName || "Guest Customer",
          totalSpent: 0,
          ordersCount: 0,
          addresses: [],
          orders: []
        };
      }

      const p = profiles[phone];
      // Prefer named user over guest
      if (o.userName && p.name === "Guest Customer") {
        p.name = o.userName;
      }

      if (o.status !== "cancelled") {
        p.totalSpent += o.totalAmount;
      }
      p.ordersCount += 1;

      if (!p.addresses.includes(addressStr)) {
        p.addresses.push(addressStr);
      }

      p.orders.push({
        id: o.id,
        timestamp: o.timestamp,
        totalAmount: o.totalAmount,
        status: o.status
      });
    });

    return Object.values(profiles).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredCustomers = customers.filter((c) => {
    return (
      c.phone.includes(searchTerm) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const selectedCustomer = selectedPhone ? customers.find((c) => c.phone === selectedPhone) || null : null;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Customer Directory</h1>
        <p className="text-xs text-[#a5948b] mt-1">Review user accounts, saved location addresses, and purchase history volumes.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Directory List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search directory by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 text-xs font-semibold focus:outline-none focus:border-[#dfb15b]"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
          </div>

          {/* List items */}
          <div className="space-y-3">
            {filteredCustomers.map((c) => (
              <button
                key={c.phone}
                onClick={() => setSelectedPhone(c.phone)}
                className={`w-full text-left p-4 bg-white/[0.01] hover:bg-white/[0.02] border rounded-2xl flex items-center justify-between transition-all ${
                  selectedPhone === c.phone ? "border-[#dfb15b]/55" : "border-white/5"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{c.name}</h4>
                  <p className="text-[10px] text-[#a5948b] mt-1 font-semibold">{c.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#a5948b] uppercase tracking-wider">Total Spent</p>
                  <p className="text-xs font-extrabold text-[#dfb15b] mt-0.5">₹{c.totalSpent.toLocaleString("en-IN")}</p>
                  <p className="text-[9px] text-[#a5948b]/60 mt-0.5">{c.ordersCount} orders</p>
                </div>
              </button>
            ))}

            {filteredCustomers.length === 0 && (
              <p className="text-xs text-[#a5948b] italic py-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                No customer profiles match the filter.
              </p>
            )}
          </div>
        </div>

        {/* Selected Customer Profile Detail Drawer */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-3xl p-6 self-start space-y-6">
          {selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-widest">{selectedCustomer.name}</h3>
                  <p className="text-[10px] text-[#a5948b] mt-1 font-semibold">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedPhone(null)}
                  className="text-[10px] font-black text-amber-500 hover:underline uppercase"
                >
                  Clear
                </button>
              </div>

              {/* Total Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase text-[#a5948b] tracking-wider">Spent</p>
                  <p className="text-sm font-extrabold text-[#dfb15b] mt-1">₹{selectedCustomer.totalSpent}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase text-[#a5948b] tracking-wider">Purchases</p>
                  <p className="text-sm font-extrabold text-white mt-1">{selectedCustomer.ordersCount}</p>
                </div>
              </div>

              {/* Addresses List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-[#a5948b] uppercase tracking-widest">Known Addresses</h4>
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((a, idx) => (
                    <p key={idx} className="text-xs text-[#e3ded9] leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                      {a}
                    </p>
                  ))}
                </div>
              </div>

              {/* Purchase history list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-[#a5948b] uppercase tracking-widest">Orders Logs</h4>
                <div className="divide-y divide-white/5 max-h-[30vh] overflow-y-auto pr-2">
                  {selectedCustomer.orders.map((ord) => (
                    <div key={ord.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white uppercase text-[10px]">ID: {ord.id.slice(0, 8)}</p>
                        <p className="text-[9px] text-[#a5948b] mt-0.5">
                          {new Date(ord.timestamp).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#dfb15b]">₹{ord.totalAmount}</p>
                        <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded font-black uppercase mt-0.5 ${
                          ord.status === "new" ? "bg-amber-500/10 text-amber-500" :
                          ord.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-[#a5948b]"
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#a5948b] space-y-2">
              <span className="text-3xl">👥</span>
              <p className="text-xs font-semibold">Select a customer profile from the list to display details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
