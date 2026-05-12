"use client";

import { type PointerEvent, useEffect, useMemo, useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import type { Address, AppNotification, Offer, Order, PaymentMethod, Product, ProductCategory, SavedAddress } from "@/lib/types";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
        Marker: new (options: Record<string, unknown>) => GoogleMarker;
        LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
        event: {
          addListenerOnce: (target: unknown, eventName: string, callback: () => void) => void;
        };
      };
    };
    initDruitsMap?: () => void;
  }
}

interface GoogleMap {
  addListener: (eventName: string, callback: (event: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
  setCenter: (latLng: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMarker {
  setPosition: (latLng: { lat: number; lng: number } | { lat: () => number; lng: () => number }) => void;
}

type Cart = Record<string, number>;
type CheckoutState = "idle" | "payment" | "success";
type ToastKind = "default" | "cart";

const categories: Array<ProductCategory | "all"> = ["all", "almonds", "cashews", "pistachios", "dates", "raisins", "walnuts", "figs"];
const packSizes = [
  { label: "1kg", value: 1 },
  { label: "500g", value: 0.5 },
  { label: "250g", value: 0.25 }
];

const emptyAddress: Address = {
  addressLine: "",
  city: "",
  pinCode: "",
  landmark: ""
};

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function formatDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  return `${day}-${month}-${year}`;
}

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [selectedPacks, setSelectedPacks] = useState<Record<string, number>>({});
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [claimedOffer, setClaimedOffer] = useState<Offer | null>(null);
  const [popupOffer, setPopupOffer] = useState<Offer | null>(null);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState<ToastKind>("default");
  const [adminAlert, setAdminAlert] = useState("");
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  function showToast(message: string, kind: ToastKind = "default") {
    setToastKind(kind);
    setToast(message);
  }

  function clearToast() {
    setToast("");
    setToastKind("default");
  }

  function dismissToastOnScreenPress(event: PointerEvent<HTMLElement>) {
    if (!toast) return;
    const target = event.target;
    if (target instanceof Element && target.closest(".toast")) return;
    clearToast();
  }

  useEffect(() => {
    const savedPhone = localStorage.getItem("druits_phone");
    const savedCart = localStorage.getItem("druits_cart");
    if (savedPhone) {
      setPhone(savedPhone);
      setIsLoggedIn(true);
    } else {
      window.location.href = "/login";
      return;
    }
    if (savedCart) {
      setCart(JSON.parse(savedCart) as Cart);
    }

    void Promise.all([
      fetch("/api/products").then((response) => response.json()),
      fetch("/api/offers").then((response) => response.json())
    ]).then(([productData, offerData]) => {
      setProducts(productData.products ?? []);
      const activeOffers = offerData.offers ?? [];
      setOffers(activeOffers);

      const newestOffer = activeOffers[0] as Offer | undefined;
      if (newestOffer && document.cookie.includes(`seen_offer_${newestOffer.id}=true`) === false) {
        setPopupOffer(newestOffer);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("druits_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!offers[0] || !isLoggedIn || !("Notification" in window)) return;

    const latestOfferId = offers[0].id;
    const notifiedOfferId = localStorage.getItem("druits_notified_offer");
    if (notifiedOfferId === latestOfferId) return;

    if (Notification.permission === "granted") {
      new Notification(`New Offer: ${offers[0].title}`, {
        body: offers[0].description
      });
      localStorage.setItem("druits_notified_offer", latestOfferId);
    }
  }, [isLoggedIn, offers]);

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

  useEffect(() => {
    if (!isLoggedIn || !phone) return;

    async function pollNotifications() {
      const response = await fetch(`/api/notifications?audience=user&phone=${encodeURIComponent(phone)}`);
      const data = (await response.json()) as { notifications?: AppNotification[] };
      const unread = (data.notifications ?? []).filter((entry) => !entry.read && !seenNotificationIds.has(entry.id));
      if (!unread.length) return;

      setSeenNotificationIds((current) => new Set([...current, ...unread.map((entry) => entry.id)]));
      const latest = unread[0];
      showToast(`${latest.title}: ${latest.message}`);
      if ("Notification" in window && Notification.permission === "granted") {
        unread.slice(0, 3).forEach((entry) => new Notification(entry.title, { body: entry.message }));
      }
      const userSpecificIds = unread.filter((entry) => entry.phone).map((entry) => entry.id);
      if (userSpecificIds.length) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: userSpecificIds })
        });
      }
    }

    void pollNotifications();
    const interval = window.setInterval(pollNotifications, 12000);
    return () => window.clearInterval(interval);
  }, [isLoggedIn, phone, seenNotificationIds]);

  useEffect(() => {
    if (!isMapOpen || !mapsApiKey) return;

    const startPosition = selectedLocation ?? { lat: 20.5937, lng: 78.9629 };

    window.initDruitsMap = () => {
      const mapElement = document.getElementById("location-map");
      if (!mapElement || !window.google) return;

      const map = new window.google.maps.Map(mapElement, {
        center: startPosition,
        zoom: selectedLocation ? 16 : 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      const marker = new window.google.maps.Marker({
        map,
        position: startPosition,
        title: "Selected delivery landmark"
      });

      map.addListener("click", (event) => {
        if (!event.latLng) return;
        const lat = Number(event.latLng.lat().toFixed(6));
        const lng = Number(event.latLng.lng().toFixed(6));
        marker.setPosition(event.latLng);
        setSelectedLocation({ lat, lng });
      });
    };

    if (window.google?.maps) {
      window.initDruitsMap();
      return;
    }

    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&callback=initDruitsMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [isMapOpen, selectedLocation]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = category === "all" || product.category === category;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      }),
    [category, products, searchQuery]
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantityKg]) => {
          const product = products.find((entry) => entry.id === productId);
          if (!product) return null;
          return {
            product,
            quantityKg,
            lineTotal: Math.round(product.pricePerKg * quantityKg)
          };
        })
        .filter(Boolean) as Array<{ product: Product; quantityKg: number; lineTotal: number }>,
    [cart, products]
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = claimedOffer?.discountCode ? Math.round(subtotal * 0.9) : subtotal;

  async function sendOtp() {
    const response = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error);
      return;
    }
    setOtpSent(true);
    showToast(`OTP sent. Local dev OTP is ${data.devOtp}.`);
  }

  async function verifyOtp() {
    const response = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp })
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error);
      return;
    }
    localStorage.setItem("druits_phone", data.user.phone);
    setPhone(data.user.phone);
    setIsLoggedIn(true);
    showToast("Logged in successfully.");
  }

  function addToCart(productId: string) {
    const product = products.find((entry) => entry.id === productId);
    if (!product || product.soldOut || product.stockKg === 0) {
      showToast("This product is currently sold out.");
      return;
    }

    const packSize = selectedPacks[productId] ?? 1;
    const currentQuantity = cart[productId] ?? 0;
    if (product.stockKg !== undefined && currentQuantity + packSize > product.stockKg) {
      showToast(`Only ${product.stockKg}kg available for this product.`);
      return;
    }

    setCart((current) => ({
      ...current,
      [productId]: Number(((current[productId] ?? 0) + packSize).toFixed(2))
    }));
    const savedPacks = JSON.parse(localStorage.getItem("druits_cart_packs") ?? "{}") as Record<string, number>;
    localStorage.setItem("druits_cart_packs", JSON.stringify({ ...savedPacks, [productId]: packSize }));
    showToast("Added to cart", "cart");
  }

  function updateQuantity(productId: string, quantityKg: number) {
    setCart((current) => {
      const product = products.find((entry) => entry.id === productId);
      const safeQuantity = product?.stockKg !== undefined ? Math.min(quantityKg, product.stockKg) : quantityKg;
      const next = { ...current };
      if (safeQuantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = Number(safeQuantity.toFixed(2));
      }
      return next;
    });
  }

  function stepQuantity(productId: string, direction: -1 | 1) {
    setCart((current) => {
      const product = products.find((entry) => entry.id === productId);
      const currentQuantity = current[productId] ?? 0;
      const nextQuantity = Number((currentQuantity + direction * 0.25).toFixed(2));
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[productId];
      } else if (product?.stockKg !== undefined && nextQuantity > product.stockKg) {
        next[productId] = product.stockKg;
      } else {
        next[productId] = nextQuantity;
      }

      return next;
    });
  }

  function claimOffer(offer: Offer) {
    setClaimedOffer(offer);
    localStorage.setItem("druits_claimed_offer", offer.id);
    const matchedProducts = (offer.autoAddItems ?? [])
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId && !entry.soldOut && entry.stockKg !== 0);
        return product ? { product, quantityKg: item.quantityKg } : null;
      })
      .filter(Boolean) as Array<{ product: Product; quantityKg: number }>;

    if (matchedProducts.length) {
      setCart((current) => {
        const next = { ...current };
        matchedProducts.forEach(({ product, quantityKg }) => {
          const maxStock = product.stockKg ?? Number.POSITIVE_INFINITY;
          next[product.id] = Math.min(maxStock, Number(((next[product.id] ?? 0) + quantityKg).toFixed(2)));
        });
        localStorage.setItem("druits_cart", JSON.stringify(next));
        return next;
      });
    }
    document.cookie = `seen_offer_${offer.id}=true; max-age=31536000; path=/; SameSite=Lax`;
    setPopupOffer(null);
    showToast(
      matchedProducts.length
        ? `Offer claimed. Coupon selected and ${matchedProducts.length} item${matchedProducts.length > 1 ? "s" : ""} added to cart.`
        : offer.discountCode
          ? `Offer claimed. Code ${offer.discountCode} will be applied in cart.`
          : "Offer claimed and saved for cart."
    );
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      showToast("Browser notifications are not supported here.");
      return;
    }
    const permission = await Notification.requestPermission();
    showToast(permission === "granted" ? "Notifications enabled for new offers." : "Notifications were not enabled.");
  }

  async function openProfile() {
    setIsProfileOpen(true);
    if (!phone) return;

    const response = await fetch(`/api/my-orders?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();
    if (response.ok) {
      setMyOrders(data.orders ?? []);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      showToast("Location is not supported by this browser.");
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
        showToast("Location added to landmark.");
      },
      () => showToast("Could not access your location.")
    );
  }

  function saveSelectedLocation() {
    if (!selectedLocation) {
      showToast("Click a map point or use current location first.");
      return;
    }

    setAddress((current) => ({
      ...current,
      landmark: `Map pin: ${selectedLocation.lat}, ${selectedLocation.lng}`
    }));
    setIsMapOpen(false);
    showToast("Landmark location saved.");
  }

  function openPaymentStep() {
    if (!isLoggedIn) {
      showToast("Please login before placing your order.");
      return;
    }

    if (!cartItems.length) {
      showToast("Your cart is empty.");
      return;
    }

    if (!address.addressLine || !address.city || !address.pinCode) {
      showToast("Complete your delivery address first.");
      return;
    }

    setCheckoutState("payment");
  }

  async function confirmOrder() {
    if (!isLoggedIn) {
      showToast("Please login before placing your order.");
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
      showToast(data.error);
      return;
    }

    setCart({});
    setAddress(emptyAddress);
    setClaimedOffer(null);
    setCheckoutState("success");
    setAdminAlert(data.adminAlert);
    showToast(`Order placed. Delivery OTP: ${data.order.deliveryOtp}`);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Order placed", {
        body: `Your order is confirmed. Delivery OTP: ${data.order.deliveryOtp}.`
      });
    }
  }

  return (
    <main className="shell" onPointerDownCapture={dismissToastOnScreenPress}>
      <SplashScreen />
      <header className="home-mobile-header">
        <a className="home-brand" href="/">
          <span className="home-brand-logo" />
          <strong>Druits</strong>
        </a>
        <div className="home-address-row">
          <span className="bolt">⌁</span>
          <span>
            <strong>{savedAddresses.find((entry) => entry.isDefault)?.name ?? "HOME"}</strong>
            <small>
              {address.addressLine ? `${address.addressLine}, ${address.city} ${address.pinCode}` : "Add your delivery address"}
            </small>
          </span>
          <a className="chevron" href="/addresses">
            ⌄
          </a>
        </div>

        <div className="home-search-row">
          <label className="home-search" htmlFor="productSearch">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              id="productSearch"
              placeholder="Search dry fruits"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <a className="home-profile-link" href={isLoggedIn ? "/profile" : "/login"} aria-label="Profile">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </a>
        </div>

        <nav className="home-icon-strip" aria-label="Quick navigation">
          <a className="active" href="#products">
            <span className="nav-sticker">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M7 13c-2.5 2.5-2.4 6.1-.5 7.6 1.9 1.4 5.3.5 7.8-2 2.5-2.6 3.3-6 1.8-7.7C14.6 9.1 9.5 10.5 7 13Z" />
                <path d="M13 6c1.8-1.8 4.4-2.2 5.7-.9 1.3 1.3.9 3.9-.9 5.7" />
              </svg>
            </span>
            Dry Fruits
          </a>
          <a href="/cart">
            <span className="nav-sticker">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
            </span>
            Cart
          </a>
          <a href="/coupons">
            <span className="nav-sticker">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M19 5 5 19" />
                <circle cx="7" cy="7" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </span>
            Coupons
          </a>
          <a href="/alerts">
            <span className="nav-sticker">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </span>
            Alerts
          </a>
        </nav>
      </header>

      <section className="section" id="products">
        <div className="section-head">
          <div>
            <h2>Dry Fruits</h2>
            <p>Prices shown per kg. Add in 500g steps, then adjust in cart.</p>
          </div>
        </div>
        <div className="filters" aria-label="Product categories">
          {categories.map((entry) => (
            <button className={`chip ${category === entry ? "active" : ""}`} key={entry} type="button" onClick={() => setCategory(entry)}>
              <span className="category-sticker">
                {entry === "all" ? "D" : entry.slice(0, 1).toUpperCase()}
              </span>
              {entry === "all" ? "All" : entry}
            </button>
          ))}
        </div>
        <div className="grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="media-wrap">
                {product.videoUrl ? (
                  <video aria-label={`${product.name} video`} muted playsInline poster={product.imageUrl} src={product.videoUrl} />
                ) : (
                  <img alt={product.name} src={product.imageUrl} />
                )}
                {product.soldOut || product.stockKg === 0 ? (
                  <span className="inventory-badge danger">Sold out</span>
                ) : product.stockKg !== undefined && product.stockKg <= 6 ? (
                  <span className="inventory-badge">{product.stockKg}kg left</span>
                ) : product.featured ? (
                  <span className="inventory-badge">Featured</span>
                ) : null}
              </div>
              <div className="product-body">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="pack-row">
                  <label htmlFor={`pack-${product.id}`}>Pack</label>
                  <select
                    id={`pack-${product.id}`}
                    value={selectedPacks[product.id] ?? 1}
                    onChange={(event) =>
                      setSelectedPacks((current) => ({
                        ...current,
                        [product.id]: Number(event.target.value)
                      }))
                    }
                  >
                    {packSizes.map((pack) => (
                      <option key={pack.label} value={pack.value}>
                        {pack.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="price-row">
                  <span className="price">₹{product.pricePerKg}/kg</span>
                  <button className="button" type="button" disabled={product.soldOut || product.stockKg === 0} onClick={() => addToCart(product.id)}>
                    {product.soldOut || product.stockKg === 0 ? "Sold out" : "Add"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!filteredProducts.length ? (
          <div className="empty-products">
            <h3>We are restocking this category</h3>
            <p>Sorry, this dry fruit is not available right now. Fresh stock will be added soon, so please check back again.</p>
          </div>
        ) : null}
      </section>

      {popupOffer ? (
        <aside className="offer-notification" role="status" aria-labelledby="offer-title">
          <span className="notice-icon">%</span>
          <div className="notice-content">
            <p id="offer-title">
              <strong>New Offer: {popupOffer.title}</strong>
              <span>{popupOffer.description}</span>
            </p>
          </div>
          <div className="notice-actions">
            <button
              className="notice-close"
              type="button"
              aria-label="Dismiss offer"
              onClick={() => {
                document.cookie = `seen_offer_${popupOffer.id}=true; max-age=31536000; path=/; SameSite=Lax`;
                setPopupOffer(null);
              }}
            >
              Close
            </button>
          </div>
        </aside>
      ) : null}

      {isProfileOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <div className="modal profile-modal">
            <div className="section-head">
              <div>
                <span className="eyebrow">My account</span>
                <h2 id="profile-title">Profile</h2>
                <p className="muted">{phone}</p>
              </div>
              <button className="button ghost" type="button" onClick={() => setIsProfileOpen(false)}>
                Close
              </button>
            </div>

            <div className="profile-grid">
              <section className="profile-block">
                <h3>Cart</h3>
                {cartItems.length ? (
                  cartItems.map((item) => (
                    <p className="muted" key={`profile-${item.product.id}`}>
                      {item.product.name}: {item.quantityKg}kg · ₹{item.lineTotal}
                    </p>
                  ))
                ) : (
                  <p className="muted">Your cart is empty.</p>
                )}
                <strong>Total: ₹{total}</strong>
              </section>

              <section className="profile-block">
                <h3>Notifications</h3>
                {offers.length ? (
                  offers.slice(0, 3).map((offer) => (
                    <p className="muted" key={`notice-${offer.id}`}>
                      {offer.title}: {offer.description}
                    </p>
                  ))
                ) : (
                  <p className="muted">No active notifications.</p>
                )}
              </section>

              <section className="profile-block">
                <h3>Orders</h3>
                {myOrders.length ? (
                  myOrders.map((order) => (
                    <div className="profile-order" key={order.id}>
                      <strong>₹{order.totalAmount}</strong>
                      <p className="muted">
                        {new Date(order.timestamp).toLocaleDateString("en-GB")} · {order.status.replaceAll("_", " ")}
                      </p>
                      <p className="muted">
                        Payment: {order.paymentMethod?.replaceAll("_", " ") ?? "Not selected"} · {order.paymentStatus ?? "pending"}
                      </p>
                      <p className="muted">{order.items.map((item) => `${item.name} ${item.quantityKg}kg`).join(", ")}</p>
                      {order.discountCode ? (
                        <p className="coupon-line">
                          Coupon used: {order.discountCode}
                          {order.offerTitle ? ` · ${order.offerTitle}` : ""} · Saved ₹{order.discountAmount ?? 0}
                        </p>
                      ) : (
                        <p className="muted">No coupon used</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="muted">No orders yet.</p>
                )}
              </section>
            </div>

            <div className="nav-actions">
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  localStorage.removeItem("druits_phone");
                  setIsLoggedIn(false);
                  setIsProfileOpen(false);
                }}
              >
                Logout
              </button>
              <a className="button" href="#cart" onClick={() => setIsProfileOpen(false)}>
                Go to cart
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toastKind === "cart" ? "cart-toast" : ""}`} role="status">
          <span>{toast}</span>
          {toastKind === "cart" ? (
            <a className="button ghost" href="/cart">
              Go to cart
            </a>
          ) : (
            <button className="button ghost" type="button" onClick={clearToast}>
              Close
            </button>
          )}
        </div>
      ) : null}
    </main>
  );
}

