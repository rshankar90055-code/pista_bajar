"use client";

import { useEffect, useState } from "react";
import type { Offer, Product } from "@/lib/types";

type Cart = Record<string, number>;

function formatDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  return `${day}-${month}-${year}`;
}

function getOfferProducts(offer: Offer, products: Product[]) {
  return (offer.autoAddItems ?? [])
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId && !entry.soldOut && entry.stockKg !== 0);
      return product ? { product, quantityKg: item.quantityKg } : null;
    })
    .filter(Boolean) as Array<{ product: Product; quantityKg: number }>;
}

export default function CouponsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [claimedOfferId, setClaimedOfferId] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setClaimedOfferId(localStorage.getItem("druits_claimed_offer") ?? "");
    void Promise.all([
      fetch("/api/offers").then((response) => response.json()),
      fetch("/api/products").then((response) => response.json())
    ]).then(([offerData, productData]) => {
      setOffers(offerData.offers ?? []);
      setProducts(productData.products ?? []);
    });
  }, []);

  function applyCoupon(offer: Offer) {
    localStorage.setItem("druits_claimed_offer", offer.id);
    setClaimedOfferId(offer.id);

    const matchedProducts = getOfferProducts(offer, products);
    if (matchedProducts.length) {
      const currentCart = JSON.parse(localStorage.getItem("druits_cart") ?? "{}") as Cart;
      const next = { ...currentCart };
      matchedProducts.forEach(({ product, quantityKg }) => {
        const maxStock = product.stockKg ?? Number.POSITIVE_INFINITY;
        const currentQuantity = next[product.id] ?? 0;
        next[product.id] = Math.min(maxStock, Math.max(currentQuantity, quantityKg));
      });
      localStorage.setItem("druits_cart", JSON.stringify(next));
    }

    window.location.href = "/cart";
  }

  function removeCoupon() {
    localStorage.removeItem("druits_claimed_offer");
    setClaimedOfferId("");
    setToast("Coupon removed.");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/cart">
          <span className="brand-mark">D</span>
          <span>Coupons</span>
        </a>
        <a className="button ghost" href="/cart">
          Cart
        </a>
      </header>

      <section className="panel">
        <div className="section-head">
          <div>
            <h1>Apply coupon</h1>
            <p className="muted">Choose one coupon for your order.</p>
          </div>
          {claimedOfferId ? (
            <button className="button ghost" type="button" onClick={removeCoupon}>
              Remove
            </button>
          ) : null}
        </div>

        <div className="coupon-list">
          {offers.map((offer) => (
            <button className={`coupon-card ${claimedOfferId === offer.id ? "selected" : ""}`} key={offer.id} type="button" onClick={() => applyCoupon(offer)}>
              <span className="coupon-topline">
                <strong>{offer.title}</strong>
                <em>{offer.discountCode ?? "SPECIAL"}</em>
              </span>
              <span className="coupon-desc">{offer.description}</span>
              {offer.extraItemText ? <span className="coupon-use">Benefit: {offer.extraItemText}</span> : <span className="coupon-use">Benefit: 10% off this order</span>}
              <span className="coupon-expiry">Expires {formatDate(offer.expiryDate)}</span>
            </button>
          ))}
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
