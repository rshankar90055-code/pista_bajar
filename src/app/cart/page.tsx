"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Offer, PaymentMethod, Product, SavedAddress, UpiApp } from "@/lib/types";

type Cart = Record<string, number>;
type CartPacks = Record<string, number>;
type CheckoutState = "idle" | "payment" | "success";

const emptyAddress: Address = {
  addressLine: "",
  city: "",
  pinCode: ""
};

const cashOnDeliveryFee = 9;
const merchantUpiId = process.env.NEXT_PUBLIC_PISTABAJAR_UPI_ID || process.env.NEXT_PUBLIC_PISTABAJAAR_UPI_ID || "shubhachandra12pro@okicici";

function buildUpiUrls(app: UpiApp, amount: number, orderId: string) {
  const transactionNote = `Pista Bajar order ${orderId.slice(0, 8)}`;
  const params = new URLSearchParams({
    pa: merchantUpiId,
    pn: "Pista Bajar",
    am: String(amount),
    cu: "INR",
    tn: transactionNote,
    tr: orderId
  });
  const query = params.toString();
  const upiUrl = `upi://pay?${query}`;
  const appUrl = app === "gpay" ? `tez://upi/pay?${query}` : `phonepe://pay?${query}`;
  const packageName = app === "gpay" ? "com.google.android.apps.nbu.paisa.user" : "com.phonepe.app";
  const intentUrl = `intent://pay?${query}#Intent;scheme=upi;package=${packageName};S.browser_fallback_url=${encodeURIComponent(upiUrl)};end`;

  return { appUrl, intentUrl, upiUrl };
}

function openUpiPaymentApp(urls: ReturnType<typeof buildUpiUrls>) {
  const fallbackTimer = window.setTimeout(() => {
    window.location.href = urls.intentUrl;
  }, 900);

  window.addEventListener("pagehide", () => window.clearTimeout(fallbackTimer), { once: true });
  window.location.href = urls.appUrl;
}

function getOfferProducts(offer: Offer, products: Product[]) {
  return {
    products: (offer.autoAddItems ?? [])
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId && !entry.soldOut && entry.stockKg !== 0);
        return product ? { product, quantityKg: item.quantityKg } : null;
      })
      .filter(Boolean) as Array<{ product: Product; quantityKg: number }>
  };
}

function inferPackSize(quantityKg: number) {
  if (quantityKg > 0 && quantityKg < 1) return quantityKg;
  if (quantityKg > 0 && Number.isInteger(quantityKg / 0.25) && !Number.isInteger(quantityKg / 0.5)) return 0.25;
  if (quantityKg > 0 && Number.isInteger(quantityKg / 0.5) && !Number.isInteger(quantityKg)) return 0.5;
  return 1;
}

function formatPackSize(packSize: number) {
  return packSize === 1 ? "1kg" : `${Math.round(packSize * 1000)}g`;
}

export default function CartPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [cartPacks, setCartPacks] = useState<CartPacks>({});
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [claimedOffer, setClaimedOffer] = useState<Offer | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [upiApp, setUpiApp] = useState<UpiApp | "">("");
  const [isPaying, setIsPaying] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [toast, setToast] = useState("");
  const [adminAlert, setAdminAlert] = useState("");
  const [isAddressPanelOpen, setIsAddressPanelOpen] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  
  // Gifting and Payment Screenshot States
  const [isGift, setIsGift] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [upiScreenshot, setUpiScreenshot] = useState("");
  const [isDirectQrPayment, setIsDirectQrPayment] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("pistabajar_phone") ?? "";
    const savedName = localStorage.getItem("pistabajar_name") ?? "";
    const savedCart = localStorage.getItem("pistabajar_cart");
    const savedCartPacks = localStorage.getItem("pistabajar_cart_packs");
    if (savedPhone) {
      setPhone(savedPhone);
      setCustomerName(savedName);
      setIsLoggedIn(true);
    }
    if (savedCart) setCart(JSON.parse(savedCart) as Cart);
    if (savedCartPacks) setCartPacks(JSON.parse(savedCartPacks) as CartPacks);

    void Promise.all([
      fetch("/api/products").then((response) => response.json()),
      fetch("/api/offers").then((response) => response.json()),
      savedPhone
        ? fetch(`/api/coupon-usage?phone=${encodeURIComponent(savedPhone)}`).then((response) => response.json())
        : Promise.resolve({ usedOfferIds: [] }),
      savedPhone
        ? fetch(`/api/savings?phone=${encodeURIComponent(savedPhone)}`).then((response) => response.json())
        : Promise.resolve({ totalSavings: 0 })
    ]).then(([productData, offerData, usageData, savingsData]) => {
      setProducts(productData.products ?? []);
      const activeOffers = (offerData.offers ?? []) as Offer[];
      setOffers(activeOffers);
      const claimedOfferId = localStorage.getItem("pistabajar_claimed_offer");
      const usedOfferIds = new Set((usageData.usedOfferIds ?? []) as string[]);
      setTotalSavings(Number(savingsData.totalSavings ?? 0));
      if (claimedOfferId && usedOfferIds.has(claimedOfferId)) {
        localStorage.removeItem("pistabajar_claimed_offer");
        setToast("That coupon was already used, so it was removed from this cart.");
        return;
      }
      const matchedOffer = activeOffers.find((offer) => offer.id === claimedOfferId);
      if (matchedOffer) {
        setClaimedOffer(matchedOffer);
        const matched = getOfferProducts(matchedOffer, productData.products ?? []);
        if (matched.products.length) {
          setCart((current) => {
            const next = { ...current };
            const nextPacks = { ...cartPacks };
            matched.products.forEach(({ product, quantityKg }) => {
              if (next[product.id]) return;
              next[product.id] = Math.min(product.stockKg ?? Number.POSITIVE_INFINITY, quantityKg);
              nextPacks[product.id] = inferPackSize(quantityKg);
            });
            localStorage.setItem("pistabajar_cart", JSON.stringify(next));
            localStorage.setItem("pistabajar_cart_packs", JSON.stringify(nextPacks));
            setCartPacks(nextPacks);
            return next;
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("pistabajar_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("pistabajar_cart_packs", JSON.stringify(cartPacks));
  }, [cartPacks]);

  useEffect(() => {
    if (!isLoggedIn || !phone) return;
    async function loadSavedAddresses() {
      const response = await fetch(`/api/addresses?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      const addresses = (data.addresses ?? []) as SavedAddress[];
      setSavedAddresses(addresses);
      const defaultAddress = addresses.find((entry) => entry.isDefault) ?? addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setAddressMode("saved");
        setAddress({
          addressLine: defaultAddress.addressLine,
          city: defaultAddress.city,
          pinCode: defaultAddress.pinCode
        });
      }
    }
    void loadSavedAddresses();
  }, [isLoggedIn, phone]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantityKg]) => {
          const product = products.find((entry) => entry.id === productId);
          if (!product) return null;
          const packSize = cartPacks[productId] ?? inferPackSize(quantityKg);
          const packCount = Math.max(1, Math.round(quantityKg / packSize));
          return { product, quantityKg, packSize, packCount, lineTotal: Math.round(product.pricePerKg * quantityKg) };
        })
        .filter(Boolean) as Array<{ product: Product; quantityKg: number; packSize: number; packCount: number; lineTotal: number }>,
    [cart, cartPacks, products]
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = claimedOffer?.discountCode ? Math.round(subtotal * 0.1) : 0;
  const codFee = paymentMethod === "cash_on_delivery" && cartItems.length ? cashOnDeliveryFee : 0;
  const giftWrapFee = isGift && giftWrap ? 49 : 0;
  const itemAmount = subtotal - discountAmount;
  const total = itemAmount + codFee + giftWrapFee;
  const hasPaymentMethod = paymentMethod === "upi" ? upiApp !== "" : paymentMethod !== "";
  const selectedSavedAddress = savedAddresses.find((entry) => entry.id === selectedAddressId);

  function stepQuantity(productId: string, direction: -1 | 1) {
    setCart((current) => {
      const product = products.find((entry) => entry.id === productId);
      const currentQuantity = current[productId] ?? 0;
      const packSize = cartPacks[productId] ?? inferPackSize(currentQuantity);
      const nextQuantity = Number((currentQuantity + direction * packSize).toFixed(2));
      const next = { ...current };
      if (nextQuantity <= 0) delete next[productId];
      else if (product?.stockKg !== undefined && nextQuantity > product.stockKg) next[productId] = product.stockKg;
      else next[productId] = nextQuantity;
      return next;
    });
  }

  function updateCartPack(productId: string, nextPackSize: number) {
    setCartPacks((current) => {
      const currentPackSize = current[productId] ?? inferPackSize(cart[productId] ?? nextPackSize);
      const currentQuantity = cart[productId] ?? nextPackSize;
      const packCount = Math.max(1, Math.round(currentQuantity / currentPackSize));
      const product = products.find((entry) => entry.id === productId);
      const nextQuantity = Number((packCount * nextPackSize).toFixed(2));
      setCart((cartCurrent) => ({
        ...cartCurrent,
        [productId]: product?.stockKg !== undefined ? Math.min(product.stockKg, nextQuantity) : nextQuantity
      }));
      return { ...current, [productId]: nextPackSize };
    });
  }

  function openPaymentStep() {
    if (!isLoggedIn) {
      setToast("Please login before placing your order.");
      return;
    }
    if (!cartItems.length) {
      setToast("Add at least one item to continue.");
      return;
    }
    if (!address.addressLine || !address.city || !address.pinCode) {
      setToast("Complete your delivery address first.");
      return;
    }
    setCheckoutState("payment");
  }

  async function confirmOrder() {
    if (isPaying || isConfirmingOrder) return;

    if (!paymentMethod) {
      setToast("Choose a payment method to see your final total.");
      return;
    }

    if (paymentMethod === "upi" && !upiApp && !isDirectQrPayment) {
      setToast("Choose GPay or PhonePe before confirming the order.");
      return;
    }

    if (paymentMethod === "upi" && !isDirectQrPayment) {
      startUpiPayment();
      return;
    }

    setIsConfirmingOrder(true);
    try {
      if (addressMode === "new" && saveNewAddress) {
        await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name: "Delivery address",
            contactPhone: phone,
            ...address,
            isDefault: savedAddresses.length === 0
          })
        });
      }

      const data = await createOrder(paymentMethod, paymentMethod === "upi" ? (upiApp || "gpay") : "");
      if (!data) return;

      completeOrder(data);
    } finally {
      setIsConfirmingOrder(false);
    }
  }

  async function createOrder(method: PaymentMethod, selectedUpiApp: UpiApp | "" = upiApp, orderId?: string) {
    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        phone,
        name: customerName,
        address,
        items: cartItems.map((item) => ({ productId: item.product.id, quantityKg: item.quantityKg })),
        claimedOfferId: claimedOffer?.id,
        discountCode: claimedOffer?.discountCode,
        paymentMethod: method,
        upiApp: method === "upi" ? selectedUpiApp : undefined,
        isGift,
        giftNote: isGift ? giftNote : undefined,
        giftWrap: isGift ? giftWrap : undefined,
        upiScreenshot: method === "upi" ? upiScreenshot : undefined
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error);
      return null;
    }
    return data;
  }

  function completeOrder(data: { order: { id: string; deliveryOtp?: string }; adminAlert: string }) {
    setCart({});
    setCartPacks({});
    setAddress(emptyAddress);
    setClaimedOffer(null);
    setIsGift(false);
    setGiftNote("");
    setGiftWrap(false);
    setUpiScreenshot("");
    localStorage.removeItem("pistabajar_claimed_offer");
    localStorage.removeItem("pistabajar_cart_packs");
    setTotalSavings((current) => current + (discountAmount || 0));
    setCheckoutState("success");
    setAdminAlert(data.adminAlert);
    setToast(`Order placed. Delivery OTP: ${data.order.deliveryOtp}`);
  }

  function startUpiPayment(selectedApp: UpiApp | "" = upiApp) {
    if (!selectedApp || isPaying) return;
    setPaymentMethod("upi");
    setUpiApp(selectedApp);
    setIsPaying(true);

    try {
      if (addressMode === "new" && saveNewAddress) {
        void fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name: "Delivery address",
            contactPhone: phone,
            ...address,
            isDefault: savedAddresses.length === 0
          })
        });
      }

      const orderId = crypto.randomUUID();
      const paymentUrls = buildUpiUrls(selectedApp, total, orderId);

      void createOrder("upi", selectedApp, orderId)
        .then((data) => {
          if (data) completeOrder(data);
        })
        .catch(() => {
          setToast("Order was not saved. Please contact support if payment was completed.");
        });

      openUpiPaymentApp(paymentUrls);
    } catch {
      setToast("Could not open payment app. Please try again.");
    } finally {
      window.setTimeout(() => setIsPaying(false), 1400);
    }
  }

  if (checkoutState === "payment") {
    return (
      <main className="shell payment-page">
        <header className="topbar">
          <button className="button ghost" type="button" onClick={() => setCheckoutState("idle")}>
            Back
          </button>
          <strong className="price">{hasPaymentMethod ? `₹${total}` : "Choose method"}</strong>
        </header>

        <section className="payment-screen">
          <div className="section-head">
            <div>
              <span className="eyebrow">Payment</span>
              <h1 id="payment-title">Choose payment method</h1>
              <p className="muted">Select how you would like to pay for this order.</p>
            </div>
          </div>

          <div className="payment-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {/* Google Pay Card */}
            <button 
              type="button"
              onClick={() => {
                setPaymentMethod("upi");
                setUpiApp("gpay");
                setIsDirectQrPayment(false);
              }}
              style={{
                background: 'var(--paper)',
                border: paymentMethod === "upi" && upiApp === "gpay" && !isDirectQrPayment ? '2px solid var(--gold)' : '1px solid var(--line)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: paymentMethod === "upi" && upiApp === "gpay" && !isDirectQrPayment ? 'var(--shadow-gold)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f4f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                  <svg style={{ width: '20px', height: '20px', display: 'block', margin: 'auto' }} viewBox="0 0 40 40">
                    <path d="M19.98 9.25c2.72 0 4.96.96 6.84 2.8l5.12-5.12C28.84 3.97 24.78 2.5 19.98 2.5 13.08 2.5 7.18 6.54 4.3 12.39l6.32 4.9C12.1 12.78 15.68 9.25 19.98 9.25z" fill="#ea4335" />
                    <path d="M37.1 20.35c0-1.28-.12-2.52-.33-3.73H19.98v7.07h9.61c-.41 2.22-1.66 4.11-3.53 5.37l5.48 4.25c3.21-2.96 5.06-7.32 5.06-12.96z" fill="#4285f4" />
                    <path d="M10.62 22.71c-.39-1.17-.62-2.42-.62-3.71s.23-2.54.62-3.71l-6.32-4.9C1.51 15.11.5 17.44.5 19.98s1.01 4.87 2.8 6.59l7.32-3.86z" fill="#fbbc05" />
                    <path d="M19.98 30.75c-4.3 0-7.88-3.53-9.36-8.04l-6.32 4.9C7.18 33.46 13.08 37.5 19.98 37.5c4.8 0 8.84-1.57 11.78-4.27l-5.48-4.25c-1.62 1.09-3.69 1.77-6.3 1.77z" fill="#34a853" />
                  </svg>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--foreground)' }}>Google Pay</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Pay instantly via secure GPay deep link</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', fontWeight: 'bold' }}>Instant</span>
            </button>

            {/* PhonePe Card */}
            <button 
              type="button"
              onClick={() => {
                setPaymentMethod("upi");
                setUpiApp("phonepe");
                setIsDirectQrPayment(false);
              }}
              style={{
                background: 'var(--paper)',
                border: paymentMethod === "upi" && upiApp === "phonepe" && !isDirectQrPayment ? '2px solid var(--gold)' : '1px solid var(--line)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: paymentMethod === "upi" && upiApp === "phonepe" && !isDirectQrPayment ? 'var(--shadow-gold)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f4effc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e3d7f5' }}>
                  <svg style={{ width: '20px', height: '20px', color: '#5f259f', display: 'block', margin: 'auto' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-5h2v5zm0-6.5h-2V8h2v2z" />
                  </svg>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--foreground)' }}>PhonePe</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Redirect and pay directly using PhonePe</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', fontWeight: 'bold' }}>Instant</span>
            </button>

            {/* UPI Direct Scan & Pay */}
            <button 
              type="button"
              onClick={() => {
                setPaymentMethod("upi");
                setUpiApp("gpay"); // Default upiApp so server validation passes
                setIsDirectQrPayment(true);
              }}
              style={{
                background: 'var(--paper)',
                border: paymentMethod === "upi" && isDirectQrPayment ? '2px solid var(--gold)' : '1px solid var(--line)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: paymentMethod === "upi" && isDirectQrPayment ? 'var(--shadow-gold)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fdfaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f3e6cd' }}>
                  <svg style={{ width: '18px', height: '18px', color: 'var(--gold)', display: 'block', margin: 'auto' }} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M14 14h2v2h-2zm4 0h3v3h-3zm-4 4h3v3h-3zm4 1h2v2h-2z" />
                  </svg>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--foreground)' }}>UPI Direct Scan & Pay QR</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Scan QR or upload payment verification proof</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 'bold' }}>QR Code</span>
            </button>

            {/* Cash on Delivery Card */}
            <button 
              type="button"
              onClick={() => {
                setPaymentMethod("cash_on_delivery");
                setUpiApp("");
                setIsDirectQrPayment(false);
              }}
              style={{
                background: 'var(--paper)',
                border: paymentMethod === "cash_on_delivery" ? '2px solid var(--gold)' : '1px solid var(--line)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: paymentMethod === "cash_on_delivery" ? 'var(--shadow-gold)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f4faf2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dcefd4' }}>
                  <svg style={{ width: '20px', height: '20px', color: '#10b981', display: 'block', margin: 'auto' }} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--foreground)' }}>Cash on Delivery</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Pay cash at your door. ₹9 Handling Charge applies</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 'bold' }}>+₹9 fee</span>
            </button>
          </div>

          {/* Inline QR Scanner and Uploader */}
          {paymentMethod === "upi" && isDirectQrPayment && (
            <div 
              style={{
                marginTop: '16px',
                padding: '20px',
                background: 'var(--paper-strong)',
                borderRadius: '24px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Direct QR Scan & Pay</span>
              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '2px solid var(--gold)', boxShadow: 'var(--shadow-gold)' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${merchantUpiId}&pn=Pista%20Bajar&am=${total}&cu=INR&tn=Order%20Payment`)}`} 
                  alt="Payment QR Code" 
                  style={{ display: 'block', width: '160px', height: '160px' }} 
                />
              </div>
              <p className="muted" style={{ fontSize: '0.75rem', lineHeight: '1.5', margin: '0', maxWidth: '90%' }}>
                Scan QR with GPay, PhonePe, Paytm or BHIM to complete your luxury checkout of <strong style={{ color: 'var(--foreground)' }}>₹{total}</strong>.
              </p>

              {/* Screenshot Upload Container */}
              <div style={{ width: '100%', borderTop: '1px dashed var(--line)', paddingTop: '16px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--foreground)', display: 'block', marginBottom: '8px' }}>📸 Upload Screenshot Verification</span>
                {!upiScreenshot ? (
                  <div 
                    style={{
                      border: '2px dashed var(--gold)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(212, 175, 55, 0.05)',
                      position: 'relative'
                    }}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUpiScreenshot(reader.result as string);
                            setToast("Screenshot uploaded successfully! 📸");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>📤</span>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--foreground)' }}>Tap to Upload Payment Proof</strong>
                    <p className="muted" style={{ fontSize: '0.65rem', margin: '2px 0 0 0' }}>JPG, PNG formats supported</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--paper)', padding: '12px', borderRadius: '16px', border: '1px solid var(--line)', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={upiScreenshot} 
                        alt="Screenshot Preview" 
                        style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }} 
                      />
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Screenshot Uploaded
                        </span>
                        <small className="muted" style={{ display: 'block', fontSize: '0.65rem' }}>Instant admin dispatch validation active</small>
                      </div>
                    </div>
                    <button 
                      className="button ghost" 
                      type="button" 
                      style={{ fontSize: '0.7rem', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ff4d4d', color: '#ff4d4d' }} 
                      onClick={() => setUpiScreenshot("")}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="payment-summary">
            <div>
              <span>Items total</span>
              <strong>₹{subtotal}</strong>
            </div>
            {discountAmount ? (
              <div>
                <span>Coupon discount</span>
                <strong>-₹{discountAmount}</strong>
              </div>
            ) : null}
            {isGift && giftWrap ? (
              <div>
                <span>Festive Gift Wrapping</span>
                <strong>+₹49</strong>
              </div>
            ) : null}
            {paymentMethod === "cash_on_delivery" ? (
              <div>
                <span>COD Handling Charge</span>
                <strong>+₹9</strong>
              </div>
            ) : null}
            <div className="payment-summary-total">
              <span>{hasPaymentMethod ? "Total amount" : "Final total"}</span>
              <strong>{hasPaymentMethod ? `₹${total}` : "After payment method"}</strong>
            </div>
          </div>
        </section>

        <div className="cart-pay-bar">
          <span>
            <small>{hasPaymentMethod ? "To pay" : "Select payment"}</small>
            <strong>{hasPaymentMethod ? `₹${total}` : "Pending"}</strong>
          </span>
          <button className="button" type="button" onClick={confirmOrder} disabled={isPaying || isConfirmingOrder}>
            {isConfirmingOrder
              ? "Placing order..."
              : paymentMethod === "upi"
                ? isPaying
                  ? "Opening payment..."
                  : upiApp
                    ? "Pay"
                    : "Choose UPI app"
                : paymentMethod
                  ? "Confirm order"
                  : "Choose payment"}
          </button>
        </div>

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

      <section className="section cart-mobile-stack">
        <button className="checkout-address-bar" type="button" onClick={() => setIsAddressPanelOpen((current) => !current)}>
          <span className="back-mark">‹</span>
          <span>
            <strong>{selectedSavedAddress?.name ?? "Delivery address"}</strong>
            <small>
              {address.addressLine ? `${address.addressLine}, ${address.city} ${address.pinCode}` : "Add delivery address"}
            </small>
          </span>
          <span className="chevron">⌄</span>
        </button>

        {isAddressPanelOpen ? (
          <div className="panel compact-panel">
            <h2>Choose address</h2>
            <div className="form">
              {savedAddresses.length ? (
                <div className="field">
                  <label>Saved addresses</label>
                  <div className="address-choice-list">
                    {savedAddresses.map((entry) => (
                      <button
                        className={`address-choice ${selectedAddressId === entry.id && addressMode === "saved" ? "selected" : ""}`}
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          setAddressMode("saved");
                          setSelectedAddressId(entry.id);
                          setAddress({
                            addressLine: entry.addressLine,
                            city: entry.city,
                            pinCode: entry.pinCode
                          });
                          setIsAddressPanelOpen(false);
                        }}
                      >
                        <span>
                          <strong>{entry.name}</strong>
                          {entry.isDefault ? <em>Default</em> : null}
                        </span>
                        <small>
                          {entry.addressLine}, {entry.city} {entry.pinCode}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <a className="button ghost full-button" href="/addresses">
                Manage saved addresses
              </a>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setAddressMode("new");
                  setSelectedAddressId("");
                  setAddress(emptyAddress);
                }}
              >
                + Add new address
              </button>
              {addressMode === "new" ? (
                <>
                  <div className="field">
                    <label htmlFor="addressLine">Address line</label>
                    <textarea
                      id="addressLine"
                      rows={4}
                      placeholder="Paste your accurate full address or Google Maps copied location here."
                      value={address.addressLine}
                      onChange={(event) => setAddress({ ...address, addressLine: event.target.value })}
                    />
                    <small className="field-help">Please paste the complete Google Maps address/location here for accurate delivery.</small>
                  </div>
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input id="city" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="pinCode">Pin code</label>
                    <input id="pinCode" inputMode="numeric" value={address.pinCode} onChange={(event) => setAddress({ ...address, pinCode: event.target.value })} />
                  </div>
                  <label className="check-row">
                    <input type="checkbox" checked={saveNewAddress} onChange={(event) => setSaveNewAddress(event.target.checked)} />
                    <span>Save this address for next time</span>
                  </label>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="savings-strip">Your savings are updated when you apply a coupon</div>
        <div className="savings-total">You Saved ₹{totalSavings} till now</div>

        <a className="coupon-entry" href="/coupons">
          <span className="coupon-icon">%</span>
          <span>
            <strong>{claimedOffer ? claimedOffer.title : "Apply coupon"}</strong>
            <small>{claimedOffer?.discountCode ? `Code ${claimedOffer.discountCode} applied` : "View available offers"}</small>
          </span>
          <span className="chevron">›</span>
        </a>

        {/* Luxury Gifting Options Panel */}
        {cartItems.length ? (
          <div className="panel" style={{ padding: '16px', background: 'var(--paper-strong)', borderRadius: 'var(--border-radius-card)', border: '1px solid var(--line)', marginBottom: '16px' }}>
            <label className="check-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isGift} 
                onChange={(event) => {
                  setIsGift(event.target.checked);
                  if (!event.target.checked) {
                    setGiftWrap(false);
                    setGiftNote("");
                  }
                }} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              <strong style={{ fontSize: '1rem', color: 'var(--foreground)' }}>🎁 Send this order as a Gift</strong>
            </label>
            
            {isGift && (
              <div className="gift-details" style={{ marginTop: '16px', paddingLeft: '8px', borderLeft: '2px solid var(--gold)' }}>
                <div className="field" style={{ marginBottom: '12px' }}>
                  <label htmlFor="giftNote" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>Gift Note Message</label>
                  <textarea
                    id="giftNote"
                    rows={3}
                    placeholder="Write a custom royal message to include with the gift..."
                    value={giftNote}
                    onChange={(event) => setGiftNote(event.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--foreground)', fontFamily: 'inherit' }}
                  />
                </div>
                
                <label className="check-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={giftWrap} 
                    onChange={(event) => setGiftWrap(event.target.checked)} 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>
                    Add Premium Festive Gift Wrapping (<strong>+₹49</strong>)
                  </span>
                </label>
              </div>
            )}
          </div>
        ) : null}

        <div className="panel cart-card-panel">
          <div className="section-head">
            <div>
              <p>{cartItems.length ? `Dry fruits (${cartItems.length} item${cartItems.length > 1 ? "s" : ""})` : "Your cart is empty."}</p>
            </div>
            <strong className="price">₹{itemAmount + (isGift && giftWrap ? 49 : 0)}</strong>
          </div>
          <div className="cart-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.product.id}>
                <img className="cart-item-image" src={item.product.imageUrl} alt="" />
                <div className="cart-item-copy">
                  <strong>{item.product.name}</strong>
                  <p className="cart-pack-line">
                    {item.packCount} {item.packCount === 1 ? "Pack" : "Packs"} ({formatPackSize(item.packSize)})
                  </p>
                  <label className="cart-pack-select">
                    Pack
                    <select value={item.packSize} onChange={(event) => updateCartPack(item.product.id, Number(event.target.value))}>
                      <option value={0.25}>250g</option>
                      <option value={0.5}>500g</option>
                      <option value={1}>1kg</option>
                    </select>
                  </label>
                  <p className="muted">₹{item.product.pricePerKg}/kg · ₹{item.lineTotal}</p>
                </div>
                <div className="qty">
                  <button className="qty-button" type="button" onClick={() => stepQuantity(item.product.id, -1)} aria-label={`Decrease ${item.product.name}`}>
                    -
                  </button>
                  <span className="qty-count" aria-label={`${item.packCount} ${item.packCount === 1 ? "pack" : "packs"} of ${item.product.name}`}>
                    {item.packCount}
                  </span>
                  <button className="qty-button" type="button" onClick={() => stepQuantity(item.product.id, 1)} aria-label={`Increase ${item.product.name}`}>
                    +
                  </button>
                </div>
                <strong className="cart-item-price">₹{item.lineTotal}</strong>
              </div>
            ))}
          </div>
          {!cartItems.length ? (
            <div className="empty-cart-action">
              <p className="muted">Add at least one dry fruit item before payment.</p>
              <a className="button secondary" href="/#products">
                Browse products
              </a>
            </div>
          ) : null}
          <div className="total-row subtle">
            <span>Items total</span>
            <span>₹{subtotal}</span>
          </div>
          {discountAmount ? (
            <div className="total-row subtle">
              <span>Coupon discount</span>
              <span>-₹{discountAmount}</span>
            </div>
          ) : null}
          {isGift && giftWrap ? (
            <div className="total-row subtle">
              <span>Festive Gift Wrapping</span>
              <span>+₹49</span>
            </div>
          ) : null}
          <div className="total-row">
            <span>Items amount</span>
            <span>₹{itemAmount + (isGift && giftWrap ? 49 : 0)}</span>
          </div>
        </div>
      </section>

      <div className="cart-pay-bar">
        <span>
          <small>Items amount</small>
          <strong>₹{itemAmount + (isGift && giftWrap ? 49 : 0)}</strong>
        </span>
        <button className="button" type="button" onClick={openPaymentStep}>
          {cartItems.length ? "Proceed to Pay" : "Add items"}
        </button>
      </div>

      {checkoutState === "success" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-title" onClick={() => setCheckoutState("idle")} style={{ position: 'relative', overflow: 'hidden' }}>
          
          {/* Pure CSS Confetti Shower */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99 }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 5;
              const duration = 2 + Math.random() * 3;
              const colors = ['#d4af37', '#aa841c', '#2c5e2d', '#596b56', '#e3ebd6', '#aa841c'];
              const color = colors[i % colors.length];
              const size = 6 + Math.random() * 8;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    background: color,
                    borderRadius: i % 2 === 0 ? '50%' : '2px',
                    opacity: 0.8,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `confetti-fall ${duration}s linear ${delay}s infinite`
                  }}
                />
              );
            })}
          </div>
          
          <style>{`
            @keyframes confetti-fall {
              0% { top: -20px; transform: translateY(0) rotate(0deg); }
              100% { top: 100%; transform: translateY(100vh) rotate(720deg); }
            }
          `}</style>

          <div className="modal success" onClick={(event) => event.stopPropagation()} style={{ border: '2px solid var(--gold)', boxShadow: 'var(--shadow-gold)', textAlign: 'center', padding: '30px' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🎉</span>
            <h2 id="success-title" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>Pista Bajar Confirmed!</h2>
            <p className="muted" style={{ fontSize: '0.95rem' }}>Your premium dry fruits order has been placed with royal care.</p>
            <div style={{ background: 'var(--paper-strong)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', margin: '16px 0' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 'bold' }}>{adminAlert}</p>
            </div>
            <div className="success-actions" style={{ justifyContent: 'center' }}>
              <a className="button" href="/orders" style={{ background: 'var(--accent)', color: '#fff' }}>
                View Order History
              </a>
              <button className="button ghost" type="button" onClick={() => setCheckoutState("idle")}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
