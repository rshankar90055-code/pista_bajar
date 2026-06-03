"use client";

import React, { useState } from "react";
import { useAdmin } from "../admin-context";
import type { Product, ProductCategory } from "@/lib/types";

const categories: ProductCategory[] = [
  "almonds",
  "cashews",
  "pistachios",
  "dates",
  "raisins",
  "walnuts",
  "figs",
  "saffron",
  "seeds",
  "snacks",
  "gifts",
  "chocolates"
];

export default function AdminProductsPage() {
  const { products, createProduct, updateProductDetails, deleteProductDetails, loadProducts } = useAdmin();
  const [editingProductId, setEditingProductId] = useState("");
  const [productForm, setProductForm] = useState({
    name: "",
    imageUrl: "",
    videoUrl: "",
    price250g: "",
    price500g: "",
    price1kg: "",
    category: "almonds" as ProductCategory,
    description: "",
    stockKg: "20",
    soldOut: false,
    featured: false
  });

  const editingProduct = products.find((p) => p.id === editingProductId) || null;

  const startEdit = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      imageUrl: p.imageUrl,
      videoUrl: p.videoUrl || "",
      price250g: String(p.price250g || ""),
      price500g: String(p.price500g || ""),
      price1kg: String(p.price1kg || ""),
      category: p.category,
      description: p.description,
      stockKg: String(p.stockKg ?? 20),
      soldOut: Boolean(p.soldOut),
      featured: Boolean(p.featured)
    });
  };

  const resetForm = () => {
    setEditingProductId("");
    setProductForm({
      name: "",
      imageUrl: "",
      videoUrl: "",
      price250g: "",
      price500g: "",
      price1kg: "",
      category: "almonds",
      description: "",
      stockKg: "20",
      soldOut: false,
      featured: false
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.imageUrl || !productForm.price1kg || !productForm.category) {
      alert("Product name, image URL, category, and 1kg price are mandatory.");
      return;
    }

    const payload = {
      ...productForm,
      pricePerKg: Number(productForm.price1kg),
      price250g: Number(productForm.price250g || Math.round(Number(productForm.price1kg) * 0.28)),
      price500g: Number(productForm.price500g || Math.round(Number(productForm.price1kg) * 0.53)),
      price1kg: Number(productForm.price1kg),
      stockKg: Number(productForm.stockKg)
    };

    let ok = false;
    if (editingProductId) {
      ok = await updateProductDetails(editingProductId, payload);
    } else {
      ok = await createProduct(payload);
    }

    if (ok) {
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product from the catalog?")) {
      const ok = await deleteProductDetails(id);
      if (ok && editingProductId === id) {
        resetForm();
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Catalog Inventory</h1>
          <p className="text-xs text-[#a5948b] mt-1">Manage dry fruit items, set pricing, adjust inventory levels.</p>
        </div>
        <button
          onClick={() => void loadProducts()}
          className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl border border-white/10 transition-colors uppercase"
        >
          🔄 Reload Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Editor Form */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-3xl p-6 self-start space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-white tracking-widest">
              {editingProduct ? "Edit Selections" : "Announce selection"}
            </h3>
            {editingProduct && (
              <button onClick={resetForm} className="text-[10px] text-amber-500 font-bold hover:underline uppercase">
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Product Name</label>
              <input
                type="text"
                placeholder="Almonds Premium Jumbo..."
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Image URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Video Link (Optional)</label>
              <input
                type="text"
                placeholder="https://...mp4"
                value={productForm.videoUrl}
                onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
              />
            </div>

            {/* 3-tier pricing */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-[#a5948b]">250g Price</label>
                <input
                  type="number"
                  placeholder="₹250"
                  value={productForm.price250g}
                  onChange={(e) => setProductForm({ ...productForm, price250g: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-[#a5948b]">500g Price</label>
                <input
                  type="number"
                  placeholder="₹480"
                  value={productForm.price500g}
                  onChange={(e) => setProductForm({ ...productForm, price500g: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-[#a5948b]">1kg Price *</label>
                <input
                  type="number"
                  placeholder="₹950"
                  value={productForm.price1kg}
                  onChange={(e) => setProductForm({ ...productForm, price1kg: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#091a10] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Stock (in kg)</label>
                <input
                  type="number"
                  placeholder="50"
                  value={productForm.stockKg}
                  onChange={(e) => setProductForm({ ...productForm, stockKg: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#a5948b]">Description</label>
              <textarea
                placeholder="Write rich features..."
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#dfb15b]"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 text-xs font-semibold text-[#a5948b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.soldOut}
                  onChange={(e) => setProductForm({ ...productForm, soldOut: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 text-[#dfb15b] focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span>Force sold out state</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold text-[#a5948b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 text-[#dfb15b] focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span>Tag as premium featured</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-[#dfb15b] hover:bg-[#c89b3c] text-[#1c130f] font-bold rounded-xl uppercase tracking-widest transition"
            >
              {editingProduct ? "Apply Modifications" : "Announce Selection"}
            </button>
          </form>
        </div>

        {/* Product List Panel */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-widest">Active Storefront Catalog</h3>
          
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {products.map((p) => (
              <div 
                key={p.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.02] border rounded-2xl gap-4 transition-all ${
                  editingProductId === p.id ? "border-[#dfb15b]/55" : "border-white/5"
                }`}
              >
                <div className="flex gap-4 items-center">
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{p.name}</h4>
                    <p className="text-[10px] text-[#a5948b] mt-1 font-semibold uppercase">
                      Category: {p.category} · Stock: {p.soldOut || p.stockKg === 0 ? "Sold out" : `${p.stockKg}kg`}
                    </p>
                    <p className="text-[9px] text-[#dfb15b] mt-1.5">
                      Prices: ₹{p.price250g} (250g) · ₹{p.price500g} (500g) · ₹{p.price1kg} (1kg)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => startEdit(p)}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider transition border border-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(p.id)}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider transition border border-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <p className="text-xs text-[#a5948b] italic py-8 text-center">No products are in the catalog.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
