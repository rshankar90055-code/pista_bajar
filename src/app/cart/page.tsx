"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Offer, PaymentMethod, Product, SavedAddress } from "@/lib/types";

type Cart = Record<string, number>;
type CartPacks = Record<string, number>;
type CheckoutState = "idle" | "payment" | "success";

const emptyAddress: Address = {
  addressLine: "",
  city: "",
  pinCode: "",
  landmark: ""
};

const cashOnDeliveryFee = 9;

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
  const [toast, setToast] = useState("");
  const [adminAlert, setAdminAlert] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddressPanelOpen, setIsAddressPanelOpen] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("druits_phone") ?? "";
    const savedCart = localStorage.getItem("druits_cart");
    const savedCartPacks = localStorage.getItem("druits_cart_packs");
    if (savedPhone) {
      setPhone(savedPhone);
      setIsLoggedIn(true);
    }
    if (savedCart) setCart(JSON.parse(savedCart) as Cart);
    if (savedCartPacks) setCartPacks(JSON.parse(savedCartPacks) as CartPacks);

    void Promise.all([
      fetch("/api/products").then((response) => response.json()),
      fetch("/api/offers").then((response) => response.json())
    ]).then(([productData, offerData]) => {
      setProducts(productData.products ?? []);
      const activeOffers = (offerData.offers ?? []) as Offer[];
      setOffers(activeOffers);
      const claimedOfferId = localStorage.getItem("druits_claimed_offer");
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
            localStorage.setItem("druits_cart", JSON.stringify(next));
            localStorage.setItem("druits_cart_packs", JSON.stringify(nextPacks));
            setCartPacks(nextPacks);
            return next;
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("druits_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("druits_cart_packs", JSON.stringify(cartPacks));
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
          pinCode: defaultAddress.pinCode,
          landmark: defaultAddress.landmark
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
  const itemAmount = subtotal - discountAmount;
  const total = itemAmount + codFee;
  const hasPaymentMethod = paymentMethod !== "";
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

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setToast("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setSelectedLocation({ lat, lng });
        setAddress((current) => ({
          ...current,
          landmark: `Map pin: ${lat}, ${lng}`
        }));
        setToast("Live location added to landmark.");
      },
      () => setToast("Could not access your live location.")
    );
  }

  async function confirmOrder() {
    if (!paymentMethod) {
      setToast("Choose a payment method to see your final total.");
      return;
    }

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

    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        address,
        items: cartItems.map((item) => ({ productId: item.product.id, quantityKg: item.quantityKg })),
        claimedOfferId: claimedOffer?.id,
        discountCode: claimedOffer?.discountCode,
        paymentMethod
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error);
      return;
    }

    setCart({});
    setCartPacks({});
    setAddress(emptyAddress);
    setClaimedOffer(null);
    localStorage.removeItem("druits_claimed_offer");
    localStorage.removeItem("druits_cart_packs");
    setCheckoutState("success");
    setAdminAlert(data.adminAlert);
    setToast(`Order placed. Delivery OTP: ${data.order.deliveryOtp}`);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Order placed", { body: `Your order is confirmed. Delivery OTP: ${data.order.deliveryOtp}.` });
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

          <div className="payment-options">
            <button className={`payment-option ${paymentMethod === "cash_on_delivery" ? "active" : ""}`} type="button" onClick={() => setPaymentMethod("cash_on_delivery")}>
              <strong>Cash on delivery</strong>
              <span>Pay when your dry fruits arrive. A small ₹9 cash handling charge will be added.</span>
            </button>
            <button className={`payment-option ${paymentMethod === "upi" ? "active" : ""}`} type="button" onClick={() => setPaymentMethod("upi")}>
              <strong>UPI pay</strong>
              <span>Mock UPI payment marked paid locally.</span>
            </button>
            <button className={`payment-option ${paymentMethod === "card" ? "active" : ""}`} type="button" onClick={() => setPaymentMethod("card")}>
              <strong>Card pay</strong>
              <span>Mock card payment marked paid locally.</span>
            </button>
          </div>

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
          <button className="button" type="button" onClick={confirmOrder} disabled={!hasPaymentMethod}>
            Confirm order
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
          <span className="brand-mark">D</span>
          <span>Druits</span>
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
                            pinCode: entry.pinCode,
                            landmark: entry.landmark
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
                    <textarea id="addressLine" rows={3} value={address.addressLine} onChange={(event) => setAddress({ ...address, addressLine: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input id="city" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="pinCode">Pin code</label>
                    <input id="pinCode" inputMode="numeric" value={address.pinCode} onChange={(event) => setAddress({ ...address, pinCode: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="landmark">Landmark</label>
                    <div className="location-field">
                      <input id="landmark" value={address.landmark} onChange={(event) => setAddress({ ...address, landmark: event.target.value })} />
                      <button className="icon-button" type="button" aria-label="Use live location for landmark" onClick={useCurrentLocation}>
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M12 21s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </button>
                    </div>
                    {selectedLocation ? (
                      <p className="muted">
                        Selected live location: {selectedLocation.lat}, {selectedLocation.lng}
                      </p>
                    ) : null}
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

        <a className="coupon-entry" href="/coupons">
          <span className="coupon-icon">%</span>
          <span>
            <strong>{claimedOffer ? claimedOffer.title : "Apply coupon"}</strong>
            <small>{claimedOffer?.discountCode ? `Code ${claimedOffer.discountCode} applied` : "View available offers"}</small>
          </span>
          <span className="chevron">›</span>
        </a>

        <div className="panel cart-card-panel">
          <div className="section-head">
            <div>
              <p>{cartItems.length ? `Dry fruits (${cartItems.length} item${cartItems.length > 1 ? "s" : ""})` : "Your cart is empty."}</p>
            </div>
            <strong className="price">₹{itemAmount}</strong>
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
          <div className="total-row">
            <span>Items amount</span>
            <span>₹{itemAmount}</span>
          </div>
        </div>
      </section>

      <div className="cart-pay-bar">
        <span>
          <small>Items amount</small>
          <strong>₹{itemAmount}</strong>
        </span>
        <button className="button" type="button" onClick={openPaymentStep}>
          {cartItems.length ? "Proceed to Pay" : "Add items"}
        </button>
      </div>

      {checkoutState === "success" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className="modal success">
            <h2 id="success-title">Order placed</h2>
            <p>Your dry fruits order has been saved. The admin alert is ready below.</p>
            <p>
              <strong>{adminAlert}</strong>
            </p>
            <a className="button" href="/orders">
              View orders
            </a>
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
