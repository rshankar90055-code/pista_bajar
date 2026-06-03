"use client";

import React, { useState } from "react";
import { useAdmin } from "../admin-context";
import type { Offer } from "@/lib/types";

function formatDate(dateValue: string) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  return `${day}-${month}-${year}`;
}

export default function AdminCouponsPage() {
  const { offers, products, createOfferDetails, updateOfferDetails, deleteOfferDetails, loadOffers } = useAdmin();
  const [editingOfferId, setEditingOfferId] = useState("");
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    expiryDate: "",
    discountCode: "",
    extraItemText: "",
    autoAddItems: [] as Array<{ productId: string; quantityKg: number }>,
    active: true
  });

  const editingOffer = offers.find((o) => o.id === editingOfferId) || null;

  const startEdit = (o: Offer) => {
    setEditingOfferId(o.id);
    setOfferForm({
      title: o.title,
      description: o.description,
      expiryDate: o.expiryDate || "",
      discountCode: o.discountCode || "",
      extraItemText: o.extraItemText || "",
      autoAddItems: o.autoAddItems || [],
      active: o.active
    });
  };

  const resetForm = () => {
    setEditingOfferId("");
    setOfferForm({
      title: "",
      description: "",
      expiryDate: "",
      discountCode: "",
      extraItemText: "",
      autoAddItems: [],
      active: true
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.title || !offerForm.description || !offerForm.discountCode || !offerForm.expiryDate) {
      alert("Offer title, description, discount code, and expiration are mandatory.");
      return;
    }

    let ok = false;
    if (editingOfferId) {
      ok = await updateOfferDetails(editingOfferId, offerForm);
    } else {
      ok = await createOfferDetails({
        id: offerForm.discountCode.toLowerCase().replace(/\s+/g, "-"),
        ...offerForm
      });
    }

    if (ok) {
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      const ok = await deleteOfferDetails(id);
      if (ok && editingOfferId === id) {
        resetForm();
      }
    }
  };

  const addAutoItem = () => {
    if (products.length === 0) {
      alert("No products in the catalog to bind auto-add rules.");
      return;
    }
    setOfferForm({
      ...offerForm,
      autoAddItems: [...offerForm.autoAddItems, { productId: products[0].id, quantityKg: 1 }]
    });
  };

  const updateAutoItem = (idx: number, key: "productId" | "quantityKg", val: any) => {
    const updated = offerForm.autoAddItems.map((item, i) => {
      if (i === idx) {
        return { ...item, [key]: val };
      }
      return item;
    });
    setOfferForm({ ...offerForm, autoAddItems: updated });
  };

  const removeAutoItem = (idx: number) => {
    setOfferForm({
      ...offerForm,
      autoAddItems: offerForm.autoAddItems.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Coupons & Campaigns</h1>
          <p className="text-xs text-[#a5948b] mt-1">Configure special discounts, auto-add promotional items, and campaign banners.</p>
        </div>
        <button
          onClick={() => void loadOffers()}
          className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl border border-white/10 transition-colors uppercase"
        >
          🔄 Reload Offers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-3xl p-6 self-start space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-white tracking-widest">
              {editingOffer ? "Modify Campaign" : "Draft Campaign"}
            </h3>
            {editingOffer && (
              <button onClick={resetForm} className="text-[10px] text-amber-500 font-bold hover:underline uppercase">
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Offer Title</label>
              <input
                type="text"
                placeholder="Grand Opening 15% Off..."
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Discount Code</label>
              <input
                type="text"
                placeholder="PISTA15"
                value={offerForm.discountCode}
                onChange={(e) => setOfferForm({ ...offerForm, discountCode: e.target.value.toUpperCase() })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Expiry Date</label>
                <input
                  type="date"
                  value={offerForm.expiryDate}
                  onChange={(e) => setOfferForm({ ...offerForm, expiryDate: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Extra Rule Text</label>
                <input
                  type="text"
                  placeholder="Free 250g Cashews on 1kg Saffron"
                  value={offerForm.extraItemText}
                  onChange={(e) => setOfferForm({ ...offerForm, extraItemText: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Description</label>
              <textarea
                placeholder="Apply code PISTA15 to save 15% on organic almonds..."
                rows={3}
                value={offerForm.description}
                onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                required
              />
            </div>

            {/* Auto add rule configuration */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b] block">Auto-added Product Rules</label>
              <div className="space-y-2">
                {offerForm.autoAddItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white/[0.02] border border-white/10 p-2 rounded-xl">
                    <select
                      value={item.productId}
                      onChange={(e) => updateAutoItem(idx, "productId", e.target.value)}
                      className="flex-1 bg-[#091a10] text-white border border-white/10 rounded-lg text-[10px] p-1.5 focus:border-[#dfb15b]"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name.slice(0, 15)}...
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={item.quantityKg}
                      onChange={(e) => updateAutoItem(idx, "quantityKg", Number(e.target.value))}
                      className="w-16 bg-white/5 border border-white/10 rounded-lg text-[10px] p-1 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => removeAutoItem(idx)}
                      className="text-red-400 font-bold px-1 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addAutoItem}
                className="text-[10px] font-black text-[#dfb15b] hover:text-[#c89b3c] uppercase"
              >
                + Add Auto-Added Rule
              </button>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 text-xs font-semibold text-[#a5948b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerForm.active}
                  onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 text-[#dfb15b] focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span>Active and claimable</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-[#dfb15b] hover:bg-[#c89b3c] text-[#1c130f] font-bold rounded-xl uppercase tracking-widest transition"
            >
              {editingOffer ? "Apply Modifications" : "Announce Campaign"}
            </button>
          </form>
        </div>

        {/* Coupon list */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-widest">Active Store Campaigns</h3>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {offers.map((o) => (
              <div
                key={o.id}
                className={`p-4 bg-white/[0.01] hover:bg-white/[0.02] border rounded-2xl flex justify-between gap-4 transition-all ${
                  editingOfferId === o.id ? "border-[#dfb15b]/55" : "border-white/5"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{o.title}</h4>
                    <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black ${
                      o.active ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-[#a5948b]"
                    }`}>
                      {o.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#a5948b] leading-relaxed">{o.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-[#a5948b]/80 pt-1 font-semibold uppercase">
                    <span>🎟️ Code: <strong className="text-white">{o.discountCode || "NONE"}</strong></span>
                    <span>⏰ Expiry: <strong className="text-white">{formatDate(o.expiryDate)}</strong></span>
                  </div>
                  {o.autoAddItems && o.autoAddItems.length > 0 && (
                    <div className="text-[9px] text-[#dfb15b] mt-1 font-semibold uppercase">
                      🎁 Auto Adds: {o.autoAddItems.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return `${product?.name || item.productId} (${item.quantityKg}kg)`;
                      }).join(", ")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(o)}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider transition border border-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(o.id)}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider transition border border-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {offers.length === 0 && (
              <p className="text-xs text-[#a5948b] italic py-8 text-center">No campaign/offers configured yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
