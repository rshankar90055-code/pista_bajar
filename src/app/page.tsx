"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import type { 
  Address, 
  AppNotification, 
  Offer, 
  Order, 
  PaymentMethod, 
  Product, 
  ProductCategory, 
  SavedAddress,
  UpiApp
} from "@/lib/types";

type Cart = Record<string, number>;
type Screen = 
  | "splash"
  | "onboarding"
  | "login"
  | "home"
  | "categories"
  | "listing"
  | "detail"
  | "cart"
  | "checkout"
  | "tracking"
  | "wishlist"
  | "offers"
  | "notifications"
  | "profile"
  | "history";

const categories: Array<ProductCategory | "all"> = [
  "all",
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

const categoryMetadata: Record<ProductCategory | "all", { label: string; icon: string }> = {
  all: { label: "All Items", icon: "✨" },
  almonds: { label: "Almonds", icon: "🥜" },
  cashews: { label: "Cashews", icon: "🌰" },
  pistachios: { label: "Pistachios", icon: "🟢" },
  dates: { label: "Dates", icon: "🌴" },
  raisins: { label: "Raisins", icon: "🍇" },
  walnuts: { label: "Walnuts", icon: "🪵" },
  figs: { label: "Anjeer Figs", icon: "🍯" },
  saffron: { label: "Kashmir Saffron", icon: "🌸" },
  seeds: { label: "Super Seeds", icon: "🌱" },
  snacks: { label: "Snack Mixes", icon: "🍿" },
  gifts: { label: "Luxury Gifts", icon: "🎁" },
  chocolates: { label: "Chocolates", icon: "🍫" }
};

const packSizes = [
  { label: "1kg", value: 1 },
  { label: "500g", value: 0.5 },
  { label: "250g", value: 0.25 }
];

const emptyAddress: Address = {
  addressLine: "",
  city: "",
  pinCode: ""
};

// Luxury SVGs
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const HeartIcon = ({ fill = "none", stroke = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke={stroke} strokeWidth="2.2" fill={fill}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const merchantUpiId = process.env.NEXT_PUBLIC_PISTABAJAAR_UPI_ID ?? "shubhachandra12pro@okicici";

function buildUpiUrls(app: UpiApp, amount: number, orderId: string) {
  const transactionNote = `Pista Bajaar order ${orderId.slice(0, 8)}`;
  const params = new URLSearchParams({
    pa: merchantUpiId,
    pn: "Pista Bajaar",
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

export default function StorefrontPage() {
  // App navigation state
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Pack weight mappings
  const [selectedPacks, setSelectedPacks] = useState<Record<string, number>>({});
  
  // Checkout & Gifting states
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [claimedOffer, setClaimedOffer] = useState<Offer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  
  // Custom gifting integrations
  const [isGift, setIsGift] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  
  // Toast & Ambient states
  const [toast, setToast] = useState("");
  const [totalSavings, setTotalSavings] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  
  // Search Overlay
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Onboarding screen slides
  const [onboardingSlide, setOnboardingSlide] = useState(0);

  // Smart Collapsing Header States
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  // Selected UPI App
  const [upiApp, setUpiApp] = useState<UpiApp | "">("");
  const [upiScreenshot, setUpiScreenshot] = useState<string>("");
  const [isDirectQrPayment, setIsDirectQrPayment] = useState(false);

  // Cart bounce animation state
  const [cartBounce, setCartBounce] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);


  const handleHomeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 60) {
      if (scrollTop > lastScrollTop) {
        setIsHeaderCollapsed(true);
      } else {
        setIsHeaderCollapsed(false);
      }
    } else {
      setIsHeaderCollapsed(false);
    }
    setLastScrollTop(scrollTop);
  };

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }

  // Pre-load data & restore state
  useEffect(() => {
    // Restore login
    const savedPhone = localStorage.getItem("pistabajaar_phone");
    const savedName = localStorage.getItem("pistabajaar_name") ?? "";
    const savedCart = localStorage.getItem("pistabajaar_cart");
    const savedWishlist = localStorage.getItem("pistabajaar_wishlist");
    
    if (savedPhone) {
      setPhone(savedPhone);
      setCustomerName(savedName);
      setIsLoggedIn(true);
    }
    if (savedCart) {
      setCart(JSON.parse(savedCart) as Cart);
    }
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist) as string[]);
    }

    // Load data from APIs
    void Promise.all([
      fetch("/api/products").then((res) => res.json()),
      fetch("/api/offers").then((res) => res.json()),
      savedPhone
        ? fetch(`/api/savings?phone=${encodeURIComponent(savedPhone)}`).then((res) => res.json())
        : Promise.resolve({ totalSavings: 0 })
    ]).then(([prodData, offerData, savingsData]) => {
      setProducts(prodData.products ?? []);
      setOffers(offerData.offers ?? []);
      setTotalSavings(Number(savingsData.totalSavings ?? 0));
    });

    // Run Splash transition
    const timer = setTimeout(() => {
      if (savedPhone) {
        setCurrentScreen("home");
      } else {
        setCurrentScreen("onboarding");
      }
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  // Save cart to localstorage
  useEffect(() => {
    localStorage.setItem("pistabajaar_cart", JSON.stringify(cart));
  }, [cart]);

  // Save wishlist to localstorage
  useEffect(() => {
    localStorage.setItem("pistabajaar_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Load Saved Addresses once logged in
  useEffect(() => {
    if (!isLoggedIn || !phone) return;
    async function loadAddresses() {
      const res = await fetch(`/api/addresses?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      const addresses = (data.addresses ?? []) as SavedAddress[];
      setSavedAddresses(addresses);
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        setAddress({
          addressLine: def.addressLine,
          city: def.city,
          pinCode: def.pinCode
        });
      }
    }
    void loadAddresses();
  }, [isLoggedIn, phone]);

  // Load Order History once profile opened
  const loadOrderHistory = async () => {
    if (!phone) return;
    const response = await fetch(`/api/my-orders?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();
    setMyOrders(data.orders ?? []);
  };

  useEffect(() => {
    if (currentScreen === "history" || currentScreen === "profile") {
      void loadOrderHistory();
    }
  }, [currentScreen]);

  // Handle simulated location search via GPS
  const handleLocationDetect = () => {
    setGpsDetecting(true);
    showToast("Detecting your premium location via GPS... 🛰️");
    setTimeout(() => {
      setGpsDetecting(false);
      const mockAddress = {
        addressLine: "Apt 4B, Signature Crest, Bandra West",
        city: "Mumbai",
        pinCode: "400050"
      };
      setAddress(mockAddress);
      showToast("Location updated to Bandra West, Mumbai! 📍");
    }, 1200);
  };

  // Mock voice search recognition
  const handleVoiceSearch = () => {
    setIsListening(true);
    showToast("Listening... Speak dry fruit name 🎙️");
    const mockTerms = ["Kashmir Saffron", "Royal Gift Hamper", "Emerald Pistachios", "Medjool Dates", "W240 Ivory Cashews"];
    setTimeout(() => {
      setIsListening(false);
      const word = mockTerms[Math.floor(Math.random() * mockTerms.length)];
      setSearchQuery(word);
      setIsSearchActive(true);
      showToast(`Voice input filled: "${word}" 🗣️`);
    }, 1800);
  };

  // Add items to cart
  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.soldOut) {
      showToast("Sorry, this item is sold out!");
      return;
    }
    const pack = selectedPacks[productId] ?? 1;
    setCart((prev) => ({
      ...prev,
      [productId]: Number(((prev[productId] ?? 0) + pack).toFixed(2))
    }));
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 800);
    showToast(`Added ${pack}kg ${product.name} to Cart 🛒`);
  };

  // Add/Remove wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => 
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    showToast(wishlist.includes(productId) ? "Removed from Wishlist" : "Added to Wishlist ❤️");
  };

  // Step quantity in cart
  const stepQty = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] ?? 0;
      const next = Number((current + delta).toFixed(2));
      const updated = { ...prev };
      if (next <= 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

  // Calculate prices
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const prod = products.find((p) => p.id === id);
      return prod ? { product: prod, quantity: qty, total: Math.round(prod.pricePerKg * qty) } : null;
    }).filter(Boolean) as Array<{ product: Product; quantity: number; total: number }>;
  }, [cart, products]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = claimedOffer?.discountCode ? Math.round(subtotal * 0.15) : 0; // 15% discount mock
  const shipping = subtotal > 1500 ? 0 : 49;
  const codFee = paymentMethod === "cash_on_delivery" ? 9 : 0;
  const totalAmount = subtotal - discount + shipping + codFee;

  // Claim & Apply coupon
  const handleApplyCoupon = (offer: Offer) => {
    setClaimedOffer(offer);
    showToast(`Coupon "${offer.discountCode || "LAUNCH"}" applied successfully! 🎉`);
    setCurrentScreen("cart");
  };

  // Streamlined Password & Google Auth flow
  const handleLogin = () => {
    if (!phone) {
      showToast("Please enter your Phone or Email ✉️");
      return;
    }
    if (!password) {
      showToast("Please enter your Password 🔑");
      return;
    }
    
    setIsLoggedIn(true);
    localStorage.setItem("pistabajaar_phone", phone);
    const mockName = customerName || (phone.includes("@") ? phone.split("@")[0] : "Customer");
    localStorage.setItem("pistabajaar_name", mockName);
    setCustomerName(mockName);
    showToast("Access Granted! Welcome to Pista Bajaar ✨");
    setCurrentScreen("home");
  };

  const handleSignUp = () => {
    if (!customerName.trim()) {
      showToast("Please enter your Full Name 👤");
      return;
    }
    if (!phone) {
      showToast("Please enter your Phone or Email ✉️");
      return;
    }
    if (!password) {
      showToast("Please enter your Password 🔑");
      return;
    }
    
    setIsLoggedIn(true);
    localStorage.setItem("pistabajaar_phone", phone);
    localStorage.setItem("pistabajaar_name", customerName);
    showToast("Account Created! Welcome to Pista Bajaar ✨");
    setCurrentScreen("home");
  };

  const handleGoogleLogin = () => {
    setIsLoggedIn(true);
    const mockPhone = "google-user";
    const mockName = "Google User";
    localStorage.setItem("pistabajaar_phone", mockPhone);
    localStorage.setItem("pistabajaar_name", mockName);
    setPhone(mockPhone);
    setCustomerName(mockName);
    showToast("Logged in with Google! Welcome to Pista Bajaar ✨");
    setCurrentScreen("home");
  };

  // Place Order API trigger
  const handleConfirmOrder = async () => {
    if (!address.addressLine || !address.city || !address.pinCode) {
      showToast("Please complete your delivery address first");
      setCheckoutStep(1);
      return;
    }

    if (paymentMethod === "upi" && !upiApp && !isDirectQrPayment) {
      showToast("Choose GPay or PhonePe before confirming the order.");
      return;
    }

    try {
      const orderId = crypto.randomUUID();
      const selectedUpiApp = paymentMethod === "upi" ? (upiApp || "gpay") : undefined;

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          name: customerName || "Customer",
          phone,
          address,
          items: cartItems.map((item) => ({ productId: item.product.id, quantityKg: item.quantity })),
          claimedOfferId: claimedOffer?.id,
          discountCode: claimedOffer?.discountCode,
          paymentMethod,
          upiApp: selectedUpiApp,
          isGift,
          giftNote,
          giftWrap,
          upiScreenshot: paymentMethod === "upi" ? upiScreenshot : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Order failed");
        return;
      }

      // If they chose Google Pay or PhonePe directly, trigger the app link!
      if (paymentMethod === "upi" && !isDirectQrPayment && selectedUpiApp) {
        const paymentUrls = buildUpiUrls(selectedUpiApp as UpiApp, totalAmount + (giftWrap ? 49 : 0), orderId);
        openUpiPaymentApp(paymentUrls);
      }

      // Success! Clear cart, setup order, open success trigger
      setCart({});
      setClaimedOffer(null);
      setIsGift(false);
      setGiftNote("");
      setGiftWrap(false);
      setUpiScreenshot("");
      setIsDirectQrPayment(false);
      setActiveOrder(data.order);
      
      setCurrentScreen("tracking");
      showToast("Order Placed Successfully! Custom packing initiated 🎁");
    } catch {
      showToast("Network connection error, please retry");
    }
  };

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchQuery = !searchQuery ? true : p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [category, searchQuery, products]);

  // User stats
  const premiumSavingsText = `Total Saved: ₹${totalSavings + discount}`;

  return (
    <div className="relative flex flex-col h-[100dvh] min-h-[100svh] bg-[#fbf9f4] text-[#2d1e18] overflow-hidden">
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -60, x: "-50%" }}
            animate={{ opacity: 1, y: 16, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="absolute left-1/2 top-4 z-[9999] px-5 py-3.5 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] border border-[#dfb15b]/30 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold tracking-wide w-[88%] text-center justify-center backdrop-blur-md"
          >
            <span className="text-[#dfb15b]">✦</span>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCREEN 1: SPLASH SCREEN (Managed via global client overlay) */}
      {currentScreen === "splash" && (
        <SplashScreen onComplete={() => setCurrentScreen(phone ? "home" : "onboarding")} />
      )}
      
      {/* SCREEN 2: ONBOARDING CAROUSEL */}
      {currentScreen === "onboarding" && (
        <div className="onboarding-screen">
          <div className="onboarding-header">
            <span className="text-lg font-black tracking-widest text-[#dfb15b]">PISTA BAJAAR</span>
            <button onClick={() => setCurrentScreen("login")} className="text-xs font-semibold text-[#dfc7b0] tracking-wider uppercase opacity-80 hover:opacity-100">Skip</button>
          </div>

          <div className="onboarding-content">
            <AnimatePresence mode="wait">
              {onboardingSlide === 0 && (
                <motion.div 
                  key="slide0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="onboarding-slide"
                >
                  <div className="onboarding-visual">
                    <span className="text-6xl">🎁</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#fbf9f5] to-[#dfc7b0] tracking-tight">Luxury Unboxing</h2>
                  <p className="text-xs text-[#a5948b] leading-relaxed mt-3 max-w-[260px]">Savor premium dry fruits hand-packed in gold-foil gift boxes with personalized patisserie ribbons.</p>
                </motion.div>
              )}
              {onboardingSlide === 1 && (
                <motion.div 
                  key="slide1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="onboarding-slide"
                >
                  <div className="onboarding-visual">
                    <span className="text-6xl">⏱️</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#fbf9f5] to-[#dfc7b0] tracking-tight">Zepto Speed</h2>
                  <p className="text-xs text-[#a5948b] leading-relaxed mt-3 max-w-[260px]">Guaranteed ultra-fast courier unboxing, delivered straight to your door in 15-20 minutes flat.</p>
                </motion.div>
              )}
              {onboardingSlide === 2 && (
                <motion.div 
                  key="slide2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="onboarding-slide"
                >
                  <div className="onboarding-visual">
                    <span className="text-6xl">🥗</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#fbf9f5] to-[#dfc7b0] tracking-tight">Pure Organic Wellness</h2>
                  <p className="text-xs text-[#a5948b] leading-relaxed mt-3 max-w-[260px]">All-natural premium Kashmiri Kesar, raw organic almonds, seeds, and sugar-free chocolates.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="onboarding-dots" aria-label="Onboarding progress">
              {[0, 1, 2].map((idx) => (
                <span 
                  key={idx}
                  className={`onboarding-dot ${onboardingSlide === idx ? "active" : ""}`} 
                />
              ))}
            </div>
          </div>

          <div className="onboarding-footer">
            <button 
              onClick={() => {
                if (onboardingSlide < 2) {
                  setOnboardingSlide(onboardingSlide + 1);
                } else {
                  setCurrentScreen("login");
                }
              }}
              className="onboarding-cta"
            >
              {onboardingSlide === 2 ? "GET STARTED" : "CONTINUE"}
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: LOGIN / SIGNUP */}
      {currentScreen === "login" && (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#1c130f] via-[#120e0d] to-[#090706] text-white p-6 justify-between z-50 overflow-y-auto">
          <div className="mt-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#dfb15b] to-[#b88d3d] flex items-center justify-center shadow-lg mb-4 p-1 overflow-hidden">
              <img src="/pistabajaar-logo.png" alt="Pista Bajaar" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#dfb15b] to-[#dfc7b0] tracking-tight">Pista Bajaar</h1>
            <p className="text-xs text-[#a5948b] mt-1 font-semibold tracking-wide text-center">
              {isSignUp ? "Create a free shopping account" : "Welcome back to Pista Bajaar"}
            </p>
          </div>

          <div className="my-auto flex flex-col gap-4 py-6 w-full max-w-sm mx-auto">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <label className="text-[10px] font-bold text-[#dfb15b] uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name" 
                  className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#dfb15b] transition text-xs font-medium"
                />
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#dfb15b] uppercase tracking-wider block">Phone or Email</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter email or phone number" 
                className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#dfb15b] transition text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#dfb15b] uppercase tracking-wider block">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" 
                className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#dfb15b] transition text-xs font-medium"
              />
            </div>

            {/* CTA Login / Signup Button */}
            <button 
              onClick={isSignUp ? handleSignUp : handleLogin}
              className="py-3.5 mt-2 bg-gradient-to-r from-[#dfb15b] to-[#b88d3d] hover:from-[#cfa054] hover:to-[#aa841c] text-[#1c130f] font-extrabold rounded-xl text-xs transition shadow-lg tracking-wider uppercase w-full text-center"
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </button>

            {/* Google Divider */}
            <div className="flex items-center my-2">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="px-3 text-[10px] text-[#a5948b] font-bold uppercase tracking-wider">Or</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Google Sign In */}
            <button 
              onClick={handleGoogleLogin}
              className="py-3 bg-white text-black hover:bg-slate-50 font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-2.5 w-full border border-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center mt-auto py-2">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[#dfb15b] hover:text-[#cfa054] font-bold tracking-wide transition hover:underline"
            >
              {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
            </button>
            <p className="text-[9px] text-[#a5948b]/60 leading-relaxed max-w-[260px] mx-auto mt-3">
              By accessing Pista Bajaar, you agree to our terms of service. Premium dry fruits delivered in 15-20 minutes.
            </p>
          </div>
        </div>
      )}

      {/* INTERACTIVE SCREENS OVERLAY (Cart, Profile, Wishlist, Search, Categories, History etc.) */}
      
      {/* 4. HOME DASHBOARD SCREEN */}
      {currentScreen === "home" && (
        <div className="premium-screen-container">
          
          {/* Dashboard Header */}
          <motion.div 
            animate={{ 
              height: isHeaderCollapsed ? "74px" : "auto",
              paddingTop: isHeaderCollapsed ? "28px" : "48px",
              paddingBottom: isHeaderCollapsed ? "10px" : "14px",
              backgroundColor: isHeaderCollapsed ? "rgba(45, 30, 24, 0.95)" : "rgba(45, 30, 24, 1)"
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`text-white px-4 flex flex-col gap-2.5 shadow-md relative z-20 ${isHeaderCollapsed ? "backdrop-blur-md border-b border-[#dfb15b]/25 bg-[#2d1e18]/95" : "bg-gradient-to-r from-[#2d1e18] to-[#120e0d]"}`}
          >
            <AnimatePresence initial={false}>
              {!isHeaderCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-10 h-10 rounded-xl bg-[#dfb15b] flex items-center justify-center shadow-lg p-0.5 overflow-hidden">
                        <img src="/pistabajaar-logo.png" alt="Pista Bajaar" className="h-9 w-9 object-contain" />
                      </div>
                      <div>
                        <h1 className="text-sm font-extrabold text-white tracking-wide">Pista Bajaar</h1>
                        <p className="text-[10px] text-[#a5948b] font-medium flex items-center gap-1">
                          <span>Customer:</span>
                          <span className="text-[#dfb15b] font-semibold">{customerName || "Customer"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentScreen("notifications")} 
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative hover:bg-white/10"
                      >
                        <BellIcon />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#dfb15b] rounded-full" />
                      </button>
                      <button 
                        onClick={() => setCurrentScreen("offers")}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
                      >
                        <span className="text-sm font-bold text-[#dfb15b]">%</span>
                      </button>
                    </div>
                  </div>

                  {/* Address bar with GPS */}
                  <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl py-2 px-3 border border-white/10">
                    <div className="flex gap-2 items-center min-w-0">
                      <span className="text-lg">📍</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Fast Delivery ETA: 19 Mins</p>
                        <p className="text-white font-medium truncate text-xs mt-0.5">{address.addressLine || "Tap to detect GPS Address"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLocationDetect}
                      disabled={gpsDetecting}
                      className="text-[10px] bg-[#dfb15b] hover:bg-[#cfa054] text-[#120e0d] py-1 px-2.5 rounded-lg font-bold transition flex items-center gap-1"
                    >
                      {gpsDetecting ? "⌛" : "GPS"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search row with voice activation */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">
                <SearchIcon />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setIsSearchActive(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw almonds, Kashmir kesar..." 
                className="w-full py-2.5 pl-12 pr-12 rounded-xl bg-white text-[#2d1e18] placeholder-black/40 outline-none text-xs font-semibold focus:ring-1 focus:ring-[#dfb15b]"
              />
              <button 
                onClick={handleVoiceSearch}
                disabled={isListening}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-base"
              >
                {isListening ? "🎙️" : "🎤"}
              </button>
            </div>
          </motion.div>

          {/* Home Content Pane */}
          <div onScroll={handleHomeScroll} className="flex-1 overflow-y-auto p-4 space-y-5 pb-12">
            
            {/* Premium Hero Banner */}
            <div className="relative h-44 rounded-3xl overflow-hidden shadow-lg border border-[#dfb15b]/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,30,24,0.7),rgba(18,14,13,0.92))]" />
              <img 
                src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80" 
                alt="Festive Hampers" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <div>
                  <span className="text-[9px] font-bold tracking-widest text-[#dfb15b] uppercase block">Pista Bajaar Choice</span>
                  <h2 className="text-xl font-black mt-1 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#dfc7b0]">Royal Gold Hamper</h2>
                  <p className="text-[10px] text-white/70 max-w-[180px] mt-1.5 leading-relaxed">Pure Kashmiri Saffron, roasted cashews, and dates pack. Gift premium unboxing today.</p>
                </div>
                <button 
                  onClick={() => {
                    const box = products.find((p) => p.id === "gift-festive");
                    if (box) {
                      setSelectedProduct(box);
                      setCurrentScreen("detail");
                    }
                  }}
                  className="self-start py-2 px-4 bg-[#dfb15b] hover:bg-[#cfa054] text-[#120e0d] rounded-xl text-[10px] font-extrabold tracking-wider transition shadow"
                >
                  ACQUIRE NOW
                </button>
              </div>
            </div>

            {/* Quick Categories list */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black tracking-wider text-[#2d1e18] uppercase">Premium Categories</h3>
                <button onClick={() => setCurrentScreen("categories")} className="text-[10px] font-bold text-[#dfb15b] uppercase tracking-wide hover:underline">All categories ›</button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.slice(1, 7).map((cat) => {
                  const meta = categoryMetadata[cat];
                  return (
                    <button 
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setCurrentScreen("listing");
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-[#efe3d3] shadow-sm min-w-[70px] flex-shrink-0 hover:border-[#dfb15b]"
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <span className="text-[9px] font-extrabold text-[#2d1e18]">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flash Sales list */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black tracking-wider text-[#2d1e18] uppercase flex items-center gap-1.5">
                  <span className="text-[#dfb15b]">⚡</span>
                  <span>Flash Sales (15% Off)</span>
                </h3>
                <span className="text-[9px] font-bold bg-[#dfb15b]/20 text-[#b88d3d] px-2.5 py-1 rounded-md tracking-wider">Ends in 2h 40m</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {products.slice(0, 2).map((prod) => (
                  <div key={prod.id} className="bg-white rounded-2xl border border-[#efe3d3] overflow-hidden flex flex-col shadow-sm relative group hover:border-[#dfb15b]/45 transition">
                    <motion.button 
                      whileTap={{ scale: 1.4 }} 
                      transition={{ type: "spring", stiffness: 500, damping: 10 }}
                      onClick={() => toggleWishlist(prod.id)}
                      className="absolute right-2.5 top-2.5 z-10 w-7 h-7 rounded-full bg-white/80 border border-[#efe3d3] flex items-center justify-center text-[#2d1e18] hover:bg-white focus:outline-none"
                    >
                      <HeartIcon 
                        fill={wishlist.includes(prod.id) ? "#ff3b30" : "none"} 
                        stroke={wishlist.includes(prod.id) ? "#ff3b30" : "currentColor"} 
                      />
                    </motion.button>
                    
                    <div 
                      onClick={() => {
                        setSelectedProduct(prod);
                        setCurrentScreen("detail");
                      }}
                      className="aspect-square bg-slate-50 cursor-pointer overflow-hidden relative"
                    >
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <span className="absolute bottom-2 left-2 text-[9px] font-extrabold bg-[#2d1e18] text-[#dfb15b] px-2 py-0.5 rounded">15% OFF</span>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-[#2d1e18] line-clamp-1">{prod.name}</h4>
                        <p className="text-[9px] text-[#72625a] mt-0.5">Pack: 1kg</p>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-black text-[#2d1e18]">₹{prod.pricePerKg}</span>
                        <button 
                          onClick={() => addToCart(prod.id)}
                          className="py-1 px-3 bg-[#2d1e18] hover:bg-[#120e0d] text-white text-[9px] font-extrabold rounded-lg transition"
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Sellers Section */}
            <div>
              <h3 className="text-xs font-black tracking-wider text-[#2d1e18] uppercase mb-3 flex items-center gap-1">
                <span>⭐</span>
                <span>Pista Bajaar Best Sellers</span>
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {products.slice(2, 6).map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-white rounded-2xl border border-[#efe3d3] overflow-hidden flex flex-col shadow-sm w-36 flex-shrink-0 relative hover:border-[#dfb15b]"
                  >
                    <div 
                      onClick={() => {
                        setSelectedProduct(prod);
                        setCurrentScreen("detail");
                      }}
                      className="h-28 bg-slate-50 cursor-pointer overflow-hidden relative"
                    >
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-[8px] font-extrabold bg-[#dfb15b] text-[#1c130f] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Top rated</span>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-[#2d1e18] line-clamp-1">{prod.name}</h4>
                        <p className="text-[8px] text-[#72625a] mt-0.5">Rating: 4.9 (240+)</p>
                      </div>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[10px] font-black text-[#2d1e18]">₹{prod.pricePerKg}</span>
                        <button 
                          onClick={() => addToCart(prod.id)}
                          className="py-1 px-2.5 bg-[#dfb15b] hover:bg-[#cfa054] text-[#1c130f] text-[9px] font-black rounded-lg transition"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Trust building box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#f6eedc] to-white border border-[#dfb15b]/20 flex gap-3.5 items-center">
              <span className="text-3xl">🛡️</span>
              <div>
                <h4 className="text-[10px] font-extrabold text-[#2d1e18] uppercase tracking-wider">Pista Bajaar Gold Standard Guarantee</h4>
                <p className="text-[9px] text-[#72625a] mt-1 leading-relaxed">Every packet of dry fruits undergoes triple-level laser cleaning, visual hand sorting, and airtight vacuum packaging.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SCREEN 5: CATEGORIES SHEET */}
      {currentScreen === "categories" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Categories</h2>
            <button onClick={() => setCurrentScreen("home")} className="text-xs text-[#dfc7b0] hover:underline">Back</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3.5">
            {categories.slice(1).map((cat) => {
              const meta = categoryMetadata[cat];
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button 
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setCurrentScreen("listing");
                  }}
                  className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-[#efe3d3] shadow-sm hover:border-[#dfb15b] hover:shadow transition"
                >
                  <span className="text-4xl">{meta.icon}</span>
                  <span className="text-xs font-extrabold text-[#2d1e18] mt-2.5 tracking-wide">{meta.label}</span>
                  <span className="text-[9px] text-[#72625a] mt-1">{count} Luxury Items</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SCREEN 6: PRODUCT LISTING */}
      {currentScreen === "listing" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <div>
              <span className="text-[8px] font-bold text-[#dfb15b] uppercase tracking-widest">Pista Bajaar Pantry</span>
              <h2 className="text-xs font-black uppercase tracking-wider">{category === "all" ? "All dry fruits" : categoryMetadata[category].label}</h2>
            </div>
            <button 
              onClick={() => {
                setCategory("all");
                setCurrentScreen("home");
              }} 
              className="text-xs text-[#dfc7b0] hover:underline"
            >
              Back
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <span className="text-5xl">🪵</span>
                <h3 className="text-sm font-extrabold text-[#2d1e18] mt-4">Pantry Restocking</h3>
                <p className="text-xs text-[#72625a] max-w-[200px] mt-1">Fresh organic stock arriving tomorrow. Tap below to see other ranges.</p>
                <button 
                  onClick={() => {
                    setCategory("all");
                    setSearchQuery("");
                  }} 
                  className="mt-4 py-2 px-4 bg-[#dfb15b] text-[#1c130f] text-[10px] font-extrabold rounded-lg tracking-wider transition"
                >
                  SHOW ALL ITEMS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="bg-white rounded-3xl border border-[#efe3d3] overflow-hidden flex flex-col shadow-sm relative group hover:border-[#dfb15b]/45 transition">
                    <motion.button 
                      whileTap={{ scale: 1.4 }} 
                      transition={{ type: "spring", stiffness: 500, damping: 10 }}
                      onClick={() => toggleWishlist(prod.id)}
                      className="absolute right-2.5 top-2.5 z-10 w-7 h-7 rounded-full bg-white/80 border border-[#efe3d3] flex items-center justify-center text-[#2d1e18] hover:bg-white focus:outline-none"
                    >
                      <HeartIcon 
                        fill={wishlist.includes(prod.id) ? "#ff3b30" : "none"} 
                        stroke={wishlist.includes(prod.id) ? "#ff3b30" : "currentColor"} 
                      />
                    </motion.button>
                    
                    <div 
                      onClick={() => {
                        setSelectedProduct(prod);
                        setCurrentScreen("detail");
                      }}
                      className="aspect-square bg-slate-50 cursor-pointer overflow-hidden"
                    >
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-[#2d1e18] line-clamp-1">{prod.name}</h4>
                        <p className="text-[8px] text-[#72625a] mt-0.5 line-clamp-2">{prod.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-black text-[#2d1e18]">₹{prod.pricePerKg}</span>
                        <button 
                          onClick={() => addToCart(prod.id)}
                          className="py-1 px-3 bg-[#2d1e18] hover:bg-[#120e0d] text-white text-[9px] font-extrabold rounded-lg transition"
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 7: PRODUCT DETAIL PAGE */}
      {currentScreen === "detail" && selectedProduct && (() => {
        const selectedWeight = selectedPacks[selectedProduct.id] ?? 1;
        const dynamicPrice = Math.round(selectedProduct.pricePerKg * selectedWeight);
        const selectedWeightLabel = selectedWeight === 1 ? "1kg" : selectedWeight === 0.5 ? "500g" : "250g";
        const slides = [
          { label: "Signature Selection", desc: "Hand-sorted, premium export quality" },
          { label: "Laser Cleaned Purity", desc: "Triple sorted organic standard" },
          { label: "Hermetic Gold Pack", desc: "Vacuum sealed for peak aroma & crunch" }
        ];

        return (
          <div className="flex flex-col h-full bg-[#fbf9f4] z-50 overflow-hidden relative">
            
            {/* Detail header (Reduced Height & Top Actions) */}
            <div className="p-4 pt-8 pb-3 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between absolute top-0 w-full z-20 shadow-md">
              <button 
                onClick={() => setCurrentScreen("home")} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white font-bold transition-all"
              >
                ‹
              </button>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#dfb15b]">Luxurious Selection</h2>
              
              <div className="flex items-center gap-2">
                <motion.button 
                  whileTap={{ scale: 1.3 }} 
                  transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white focus:outline-none transition-all"
                >
                  <HeartIcon 
                    fill={wishlist.includes(selectedProduct.id) ? "#ff3b30" : "none"} 
                    stroke={wishlist.includes(selectedProduct.id) ? "#ff3b30" : "currentColor"} 
                  />
                </motion.button>

                <motion.button 
                  animate={cartBounce ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
                  transition={{ duration: 0.5 }}
                  onClick={() => setCurrentScreen("cart")}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white focus:outline-none relative transition-all"
                >
                  <CartIcon />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#dfb15b] text-[#2d1e18] border border-[#2d1e18] rounded-full text-[8px] font-black flex items-center justify-center shadow-md">
                      {cartItems.length}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto pt-16 pb-24">
              
              {/* Visual Interactive Gallery Frame */}
              <div className="w-full aspect-[4/3] relative bg-[#2d1e18]/5 overflow-hidden">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover transition-all duration-500" 
                  style={{ filter: activeImageIdx === 1 ? "brightness(1.05) contrast(1.05)" : activeImageIdx === 2 ? "saturate(1.1) brightness(0.98)" : "none" }}
                />
                
                {/* Blur gradient cover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#fbf9f4] via-transparent to-transparent" />
                
                {/* Dynamic Slide Badges */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl text-white max-w-[80%]">
                  <p className="text-[9px] font-black uppercase text-[#dfb15b] tracking-wider">{slides[activeImageIdx].label}</p>
                  <p className="text-[8px] text-white/80 font-semibold mt-0.5">{slides[activeImageIdx].desc}</p>
                </div>

                {/* Carousel Dot Indicators */}
                <div className="absolute top-20 right-4 flex flex-col gap-1.5 z-10">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeImageIdx ? "bg-[#dfb15b] scale-125" : "bg-white/40 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Gallery Thumbnails List */}
              <div className="flex gap-2 px-5 pb-2 overflow-x-auto scrollbar-none">
                {slides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`flex-shrink-0 p-1.5 rounded-xl border text-[9px] font-extrabold flex items-center gap-1.5 transition-all ${idx === activeImageIdx ? "bg-[#f6eedc] border-[#dfb15b] text-[#2d1e18] shadow-[0_0_8px_rgba(223,177,91,0.25)]" : "bg-white border-[#efe3d3] text-[#72625a]"}`}
                  >
                    <span className="text-xs">{idx === 0 ? "✨" : idx === 1 ? "🛡️" : "📦"}</span>
                    <span>{slide.label.split(" ")[0]} View</span>
                  </button>
                ))}
              </div>

              {/* Detail Content stack */}
              <div className="px-5 space-y-4 mt-2">
                <div>
                  <span className="text-[8px] font-extrabold bg-[#40753b]/10 text-[#40753b] px-2.5 py-1 rounded-md tracking-wider inline-block">100% ORGANIC CERTIFIED</span>
                  <h1 className="text-xl font-black text-[#2d1e18] mt-1.5 leading-snug">{selectedProduct.name}</h1>
                  
                  {/* Rating summary & Verified link */}
                  <div className="flex gap-3 items-center mt-1 text-[10px] font-bold text-[#72625a]">
                    <span className="text-[#dfb15b]">⭐ 4.9</span>
                    <span>•</span>
                    <span className="underline cursor-pointer">1,420 Verified Reviews</span>
                    <span>•</span>
                    <span className="text-[#40753b]">Chef Recommended</span>
                  </div>
                </div>

                {/* Quick Delivery Indicator Box */}
                <div className="p-3 bg-gradient-to-r from-[#fbf8f0] to-[#fbf9f4] rounded-2xl border border-[#efe3d3] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#40753b] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#40753b]"></span>
                    </span>
                    <p className="text-[10px] font-extrabold text-[#2d1e18]">
                      ⚡ Express: Delivering to <span className="text-[#b88d3d]">Bandra West</span> in <span className="text-[#40753b]">19 mins</span>
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-[#72625a] uppercase">Blinkit Speed</span>
                </div>

                {/* Price Display Block (Updates dynamically based on selected weight) */}
                <div className="p-4 bg-white rounded-3xl border border-[#efe3d3] flex justify-between items-center shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-[#dfb15b] h-full" />
                  <div>
                    <p className="text-[8px] text-[#72625a] font-bold uppercase tracking-wider">Acquisition Price ({selectedWeightLabel})</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-[#2d1e18]">₹{dynamicPrice}</span>
                      <span className="text-[9px] text-[#72625a] font-semibold">({selectedWeight === 1 ? "₹" + selectedProduct.pricePerKg + "/kg rate" : "₹" + selectedProduct.pricePerKg + "/kg equivalent"})</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase tracking-wide bg-[#40753b]/10 text-[#40753b] px-2 py-0.5 rounded-full">In Stock</span>
                    <p className="text-[8px] text-[#72625a] mt-1 font-bold">100% Hermetic Sealed</p>
                  </div>
                </div>

                {/* Weight selection Cards (Golden Highlighted & Metallic Glow) */}
                <div>
                  <label className="text-[10px] font-black text-[#2d1e18] uppercase tracking-wider block mb-2">Select Pack Size Weight</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {packSizes.map((pack) => {
                      const active = (selectedPacks[selectedProduct.id] ?? 1) === pack.value;
                      return (
                        <button 
                          key={pack.label}
                          onClick={() => setSelectedPacks((prev) => ({ ...prev, [selectedProduct.id]: pack.value }))}
                          className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center ${active ? "bg-[#2d1e18] border-[#dfb15b] text-white shadow-[0_0_12px_rgba(223,177,91,0.3)] scale-[1.03]" : "bg-white border-[#efe3d3] text-[#2d1e18] hover:border-[#dfb15b]/50"}`}
                        >
                          <span className="tracking-wide">{pack.label}</span>
                          <span className={`text-[8px] mt-0.5 font-bold ${active ? "text-[#dfb15b]" : "text-[#72625a]"}`}>₹{Math.round(selectedProduct.pricePerKg * pack.value)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-black text-[#2d1e18] uppercase tracking-wider">Luxury Description</h3>
                  <p className="text-xs text-[#72625a] leading-relaxed font-semibold">{selectedProduct.description}</p>
                </div>

                {/* Structured Health & Nutrition Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#fbf8f0] to-[#f5ecd5] border border-[#dfb15b]/30 text-xs shadow-inner">
                  <h4 className="font-black text-[#2d1e18] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>👑</span>
                    <span>Royal Health & Nutrition Card</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-[#72625a] font-bold">
                    <div className="bg-white/60 p-2 rounded-xl border border-[#efe3d3]">
                      <p className="text-[#2d1e18] text-[9px] uppercase tracking-wider">🧬 Protein Energy</p>
                      <p className="text-[8px] font-normal mt-0.5">High muscle & energy replenishment support</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-[#efe3d3]">
                      <p className="text-[#2d1e18] text-[9px] uppercase tracking-wider">🌾 Organic Dietary Fiber</p>
                      <p className="text-[8px] font-normal mt-0.5">Assists smooth, long-term digestion health</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-[#efe3d3]">
                      <p className="text-[#2d1e18] text-[9px] uppercase tracking-wider">❤️ Heart Defense</p>
                      <p className="text-[8px] font-normal mt-0.5">Rich in Omega fats for optimal cholesterol care</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-[#efe3d3]">
                      <p className="text-[#2d1e18] text-[9px] uppercase tracking-wider">🌱 Zero Additives</p>
                      <p className="text-[8px] font-normal mt-0.5">Triple sorted, zero chemicals or preservatives</p>
                    </div>
                  </div>
                </div>

                {/* Customer Reviews & Feedback Block */}
                <div className="p-4 bg-white rounded-3xl border border-[#efe3d3] space-y-3 shadow-sm">
                  <h3 className="text-[10px] font-black text-[#2d1e18] uppercase tracking-wider flex items-center gap-1">
                    <span>✨</span>
                    <span>Verified Patron Testimonials</span>
                  </h3>
                  <div className="space-y-2.5 divide-y divide-[#efe3d3]">
                    <div className="pt-2 first:pt-0">
                      <div className="flex justify-between items-center text-[9px] font-black">
                        <span className="text-[#2d1e18]">Aditya S. <span className="text-[8px] text-[#40753b] bg-[#40753b]/10 px-1.5 py-0.25 rounded-full font-bold uppercase">Verified Patron</span></span>
                        <span className="text-[#dfb15b]">⭐⭐⭐⭐⭐</span>
                      </div>
                      <p className="text-[9px] text-[#72625a] font-semibold mt-1 italic">"Absolutely world-class walnuts! Plump, crisp, and no bitter aftertaste. Pristine packaging."</p>
                    </div>
                    <div className="pt-2.5">
                      <div className="flex justify-between items-center text-[9px] font-black">
                        <span className="text-[#2d1e18]">Meera K. <span className="text-[8px] text-[#40753b] bg-[#40753b]/10 px-1.5 py-0.25 rounded-full font-bold uppercase">Verified Patron</span></span>
                        <span className="text-[#dfb15b]">⭐⭐⭐⭐⭐</span>
                      </div>
                      <p className="text-[9px] text-[#72625a] font-semibold mt-1 italic">"Blinkit style fast, but feels like an expensive boutique from Dubai. Exceptional saffron."</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Fixed Bottom Action Bar (Dual Buttons & Safe Area Padding) */}
            <div className="p-4 pb-[calc(1.2rem+env(safe-area-inset-bottom,0px))] md:pb-4 bg-white border-t border-[#efe3d3] flex gap-3 items-center absolute bottom-0 w-full z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
              <button 
                onClick={() => {
                  addToCart(selectedProduct.id);
                  // Keep user on details screen for premium UX, just update cart feedback
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2d1e18] to-[#1e120e] hover:from-[#120e0d] hover:to-[#000] text-white border border-[#dfb15b]/20 font-black rounded-2xl text-[10px] transition-all shadow-md tracking-wider uppercase text-center active:scale-95"
              >
                ADD TO PATRON CART
              </button>
              
              <button 
                onClick={() => {
                  // Add and redirect instantly
                  const pack = selectedPacks[selectedProduct.id] ?? 1;
                  setCart((prev) => ({
                    ...prev,
                    [selectedProduct.id]: Number(((prev[selectedProduct.id] ?? 0) + pack).toFixed(2))
                  }));
                  setCurrentScreen("checkout");
                  setCheckoutStep(1);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#dfb15b] to-[#b88d3d] hover:from-[#cfa054] hover:to-[#aa841c] text-[#1c130f] font-black rounded-2xl text-[10px] transition-all shadow-md tracking-wider uppercase text-center active:scale-95"
              >
                BUY NOW
              </button>
            </div>

          </div>
        );
      })()}

      {/* SCREEN 8: CART */}
      {currentScreen === "cart" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Cart</h2>
            <button onClick={() => setCurrentScreen("home")} className="text-xs text-[#dfc7b0] hover:underline">Pantry</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <span className="text-5xl">🛒</span>
                <h3 className="text-sm font-extrabold text-[#2d1e18] mt-4">Your Cart is empty</h3>
                <p className="text-xs text-[#72625a] max-w-[200px] mt-1">Acquire hand-sorted dry fruits from the pantry.</p>
                <button 
                  onClick={() => setCurrentScreen("home")} 
                  className="mt-4 py-2.5 px-5 bg-[#dfb15b] text-[#1c130f] text-[10px] font-extrabold rounded-lg tracking-wider transition"
                >
                  SHOP PISTA BAJAAR NOW
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items list */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div 
                      key={item.product.id}
                      className="p-3 bg-white rounded-2xl border border-[#efe3d3] flex gap-3 items-center shadow-sm relative"
                    >
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-extrabold text-[#2d1e18] truncate">{item.product.name}</h4>
                        <p className="text-[9px] text-[#72625a] mt-0.5">Weight: {item.quantity}kg</p>
                        <p className="text-xs font-black text-[#2d1e18] mt-1">₹{item.total}</p>
                      </div>
                      
                      {/* Qty controller buttons */}
                      <div className="flex items-center gap-2.5 bg-slate-50 border border-[#efe3d3] rounded-lg p-1 flex-shrink-0">
                        <button onClick={() => stepQty(item.product.id, -0.25)} className="w-6 h-6 rounded-md hover:bg-slate-200 text-xs font-black text-[#2d1e18]">-</button>
                        <span className="text-[10px] font-bold text-[#2d1e18] min-w-[28px] text-center">{item.quantity}kg</span>
                        <button onClick={() => stepQty(item.product.id, 0.25)} className="w-6 h-6 rounded-md hover:bg-slate-200 text-xs font-black text-[#2d1e18]">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom luxury gifting section */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#f6eedc]/40 to-white border border-[#dfb15b]/25 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-[#2d1e18] uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>Send Order as a Gift?</span>
                    </h3>
                    <input 
                      type="checkbox" 
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                      className="w-4 h-4 accent-[#dfb15b]"
                    />
                  </div>

                  {isGift && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 pt-2"
                    >
                      <div>
                        <label className="text-[9px] font-bold text-[#72625a] uppercase tracking-wider block mb-1">Handwritten Gift Card Note</label>
                        <textarea 
                          value={giftNote}
                          onChange={(e) => setGiftNote(e.target.value)}
                          placeholder="Wishing you a beautiful and healthy festive season..."
                          className="w-full p-2.5 rounded-xl bg-white border border-[#efe3d3] text-xs font-medium outline-none focus:border-[#dfb15b]"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-bold text-[#72625a]">
                        <span>Festive Royal Gold Wrapper (+₹49)</span>
                        <input 
                          type="checkbox" 
                          checked={giftWrap}
                          onChange={(e) => setGiftWrap(e.target.checked)}
                          className="w-4 h-4 accent-[#dfb15b]"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Coupon applicator link */}
                <button 
                  onClick={() => setCurrentScreen("offers")}
                  className="w-full p-3.5 bg-white border border-[#efe3d3] rounded-2xl flex justify-between items-center text-xs font-bold text-[#2d1e18] hover:border-[#dfb15b]"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-lg">🎟️</span>
                    <span>{claimedOffer ? `Coupon "${claimedOffer.discountCode}" applied` : "Apply Luxury Coupons"}</span>
                  </div>
                  <span className="text-[#dfb15b]">{claimedOffer ? "15% OFF" : "View ›"}</span>
                </button>

                {/* Bill details */}
                <div className="p-4 bg-white rounded-3xl border border-[#efe3d3] space-y-2.5 shadow-sm text-xs font-medium text-[#72625a]">
                  <h3 className="font-extrabold text-[#2d1e18] uppercase tracking-wider mb-1">Cart Summary</h3>
                  <div className="flex justify-between">
                    <span>Cart Subtotal</span>
                    <span className="text-[#2d1e18]">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#40753b]">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  {giftWrap && (
                    <div className="flex justify-between">
                      <span>Festive Ribbon Wrapping</span>
                      <span className="text-[#2d1e18]">₹49</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Express Delivery fee</span>
                    <span className="text-[#2d1e18]">{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                  </div>
                  {paymentMethod === "cash_on_delivery" && (
                    <div className="flex justify-between text-[#a06800]">
                      <span>COD Handling Charge</span>
                      <span className="text-[#a06800] font-bold">₹9</span>
                    </div>
                  )}
                  <hr className="border-[#efe3d3]" />
                  <div className="flex justify-between text-sm font-black text-[#2d1e18]">
                    <span>Grand Total</span>
                    <span>₹{totalAmount + (giftWrap ? 49 : 0)}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <button 
                  onClick={() => setCurrentScreen("checkout")}
                  className="w-full py-4 bg-[#2d1e18] hover:bg-[#120e0d] text-white font-extrabold rounded-2xl text-xs tracking-widest transition shadow-lg uppercase"
                >
                  PROCEED TO SELECT ADDRESS
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 9: CHECKOUT (STEP-BY-STEP CHECKOUT FLOW) */}
      {currentScreen === "checkout" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Secure Checkout</h2>
            <button onClick={() => setCurrentScreen("cart")} className="text-xs text-[#dfc7b0] hover:underline">Cart</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Step-by-step indicator */}
            <div className="flex justify-between items-center bg-white border border-[#efe3d3] rounded-2xl p-3 text-xs font-extrabold text-[#72625a]">
              <span className={checkoutStep === 1 ? "text-[#dfb15b]" : ""}>1. Address</span>
              <span>›</span>
              <span className={checkoutStep === 2 ? "text-[#dfb15b]" : ""}>2. Summary</span>
              <span>›</span>
              <span className={checkoutStep === 3 ? "text-[#dfb15b]" : ""}>3. Payment</span>
            </div>

            {/* STEP 1: Address selection & GPS */}
            {checkoutStep === 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-[#2d1e18] uppercase tracking-wider">Select Delivery Location</h3>
                  <button 
                    onClick={handleLocationDetect}
                    className="text-[9px] font-bold text-[#dfb15b] uppercase hover:underline"
                  >
                    Use GPS
                  </button>
                </div>

                <div className="space-y-2.5">
                  {savedAddresses.map((sa) => (
                    <button 
                      key={sa.id}
                      onClick={() => {
                        setSelectedAddressId(sa.id);
                        setAddress({
                          addressLine: sa.addressLine,
                          city: sa.city,
                          pinCode: sa.pinCode
                        });
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium flex gap-3 items-start transition ${selectedAddressId === sa.id ? "bg-[#f6eedc]/55 border-[#dfb15b]" : "bg-white border-[#efe3d3] hover:border-slate-300"}`}
                    >
                      <span className="text-lg">🏡</span>
                      <div>
                        <div className="flex gap-2 items-center">
                          <span className="font-extrabold text-[#2d1e18]">{sa.name}</span>
                          {sa.isDefault && <span className="text-[8px] bg-[#dfb15b] text-[#1c130f] px-1.5 py-0.5 rounded-full font-bold uppercase">Default</span>}
                        </div>
                        <p className="text-[#72625a] mt-1">{sa.addressLine}, {sa.city} {sa.pinCode}</p>
                        <p className="text-[10px] text-white/10 mt-1 font-semibold">Contact: {sa.contactPhone}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-white rounded-3xl border border-[#efe3d3] space-y-3 shadow-sm">
                  <h4 className="text-[10px] font-black text-[#2d1e18] uppercase tracking-wider">Delivery Details</h4>
                  
                  <div>
                    <label className="text-[9px] font-bold text-[#72625a] uppercase tracking-wider block mb-1">Building/Street Address</label>
                    <input 
                      type="text" 
                      value={address.addressLine}
                      onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                      placeholder="Flat/House number, Apartment name, Road"
                      className="w-full p-2.5 rounded-xl border border-[#efe3d3] text-xs font-semibold outline-none focus:border-[#dfb15b]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9px] font-bold text-[#72625a] uppercase tracking-wider block mb-1">City</label>
                      <input 
                        type="text" 
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full p-2.5 rounded-xl border border-[#efe3d3] text-xs font-semibold outline-none focus:border-[#dfb15b]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#72625a] uppercase tracking-wider block mb-1">Pincode</label>
                      <input 
                        type="text" 
                        value={address.pinCode}
                        onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                        placeholder="400050"
                        className="w-full p-2.5 rounded-xl border border-[#efe3d3] text-xs font-semibold outline-none focus:border-[#dfb15b]"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setCheckoutStep(2)}
                  className="w-full py-4 bg-[#2d1e18] hover:bg-[#120e0d] text-white font-extrabold rounded-2xl text-xs tracking-widest transition shadow-lg uppercase"
                >
                  NEXT: CONFIRM ORDER SUMMARY
                </button>
              </motion.div>
            )}

            {/* STEP 2: Summary confirm */}
            {checkoutStep === 2 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-xs font-black text-[#2d1e18] uppercase tracking-wider">Confirm Order details</h3>
                
                <div className="p-3.5 bg-white rounded-2xl border border-[#efe3d3] text-xs font-medium space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-[#2d1e18] uppercase tracking-wider">Delivery To</span>
                    <button onClick={() => setCheckoutStep(1)} className="text-[9px] font-bold text-[#dfb15b] uppercase hover:underline">Change</button>
                  </div>
                  <p className="text-[#2d1e18] font-bold">{customerName || "Customer"}</p>
                  <p className="text-[#72625a]">{address.addressLine}, {address.city} {address.pinCode}</p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#efe3d3] text-xs font-medium space-y-2">
                  <h4 className="font-extrabold text-[#2d1e18] uppercase tracking-wider mb-1">Cart Checkout Items</h4>
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-[#72625a]">
                      <span>{item.product.name} ({item.quantity}kg)</span>
                      <span className="text-[#2d1e18] font-bold">₹{item.total}</span>
                    </div>
                  ))}
                  {discount > 0 && (
                    <div className="flex justify-between text-[#40753b]">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  {giftWrap && (
                    <div className="flex justify-between text-[#72625a]">
                      <span>Festive Ribbon Wrapping</span>
                      <span className="text-[#2d1e18]">₹49</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#72625a]">
                    <span>Express Delivery fee</span>
                    <span className="text-[#2d1e18]">{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                  </div>
                  {paymentMethod === "cash_on_delivery" && (
                    <div className="flex justify-between text-[#a06800]">
                      <span>COD Handling Charge</span>
                      <span className="text-[#a06800] font-bold">₹9</span>
                    </div>
                  )}
                  <hr className="border-[#efe3d3] my-1" />
                  <div className="flex justify-between text-[#2d1e18] font-black">
                    <span>Grand Total</span>
                    <span>₹{totalAmount + (giftWrap ? 49 : 0)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setCheckoutStep(3)}
                  className="w-full py-4 bg-[#2d1e18] hover:bg-[#120e0d] text-white font-extrabold rounded-2xl text-xs tracking-widest transition shadow-lg uppercase"
                >
                  NEXT: PROCEED TO PAYMENT SELECT
                </button>
              </motion.div>
            )}

            {/* STEP 3: Payment Selection */}
            {checkoutStep === 3 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-xs font-black text-[#2d1e18] uppercase tracking-wider">Select Premium Payment Method</h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Google Pay Card */}
                  <button 
                    onClick={() => {
                      setPaymentMethod("upi");
                      setUpiApp("gpay");
                      setIsDirectQrPayment(false);
                    }}
                    className={`w-full p-4 rounded-2xl border text-xs font-extrabold flex justify-between items-center transition duration-300 ${paymentMethod === "upi" && upiApp === "gpay" && !isDirectQrPayment ? "bg-[#f6eedc]/55 border-[#dfb15b] shadow-[0_0_12px_rgba(223,177,91,0.2)]" : "bg-white border-[#efe3d3]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f4f7fa] flex items-center justify-center border border-[#e2e8f0]">
                        {/* GPay Branded Logo Represented beautifully with SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 40 40">
                          <path d="M19.98 9.25c2.72 0 4.96.96 6.84 2.8l5.12-5.12C28.84 3.97 24.78 2.5 19.98 2.5 13.08 2.5 7.18 6.54 4.3 12.39l6.32 4.9C12.1 12.78 15.68 9.25 19.98 9.25z" fill="#ea4335" />
                          <path d="M37.1 20.35c0-1.28-.12-2.52-.33-3.73H19.98v7.07h9.61c-.41 2.22-1.66 4.11-3.53 5.37l5.48 4.25c3.21-2.96 5.06-7.32 5.06-12.96z" fill="#4285f4" />
                          <path d="M10.62 22.71c-.39-1.17-.62-2.42-.62-3.71s.23-2.54.62-3.71l-6.32-4.9C1.51 15.11.5 17.44.5 19.98s1.01 4.87 2.8 6.59l7.32-3.86z" fill="#fbbc05" />
                          <path d="M19.98 30.75c-4.3 0-7.88-3.53-9.36-8.04l-6.32 4.9C7.18 33.46 13.08 37.5 19.98 37.5c4.8 0 8.84-1.57 11.78-4.27l-5.48-4.25c-1.62 1.09-3.69 1.77-6.3 1.77z" fill="#34a853" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[#2d1e18] text-xs font-black">Google Pay</p>
                        <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Pay instantly via secure GPay deep link</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#dfb15b]/20 text-[#b88d3d] uppercase tracking-wider font-extrabold">Instant</span>
                  </button>

                  {/* PhonePe Card */}
                  <button 
                    onClick={() => {
                      setPaymentMethod("upi");
                      setUpiApp("phonepe");
                      setIsDirectQrPayment(false);
                    }}
                    className={`w-full p-4 rounded-2xl border text-xs font-extrabold flex justify-between items-center transition duration-300 ${paymentMethod === "upi" && upiApp === "phonepe" && !isDirectQrPayment ? "bg-[#f6eedc]/55 border-[#dfb15b] shadow-[0_0_12px_rgba(223,177,91,0.2)]" : "bg-white border-[#efe3d3]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f4effc] flex items-center justify-center border border-[#e3d7f5]">
                        {/* PhonePe Purple Branded Logo represented with SVG */}
                        <svg className="w-5 h-5 text-[#5f259f]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-5h2v5zm0-6.5h-2V8h2v2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[#2d1e18] text-xs font-black">PhonePe</p>
                        <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Redirect and pay directly using PhonePe</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#dfb15b]/20 text-[#b88d3d] uppercase tracking-wider font-extrabold">Instant</span>
                  </button>

                  {/* UPI Direct Scan & Pay */}
                  <button 
                    onClick={() => {
                      setPaymentMethod("upi");
                      setUpiApp("gpay"); // Default upiApp so server validation passes
                      setIsDirectQrPayment(true);
                    }}
                    className={`w-full p-4 rounded-2xl border text-xs font-extrabold flex justify-between items-center transition duration-300 ${paymentMethod === "upi" && isDirectQrPayment ? "bg-[#f6eedc]/55 border-[#dfb15b] shadow-[0_0_12px_rgba(223,177,91,0.2)]" : "bg-white border-[#efe3d3]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fdfaf2] flex items-center justify-center border border-[#f3e6cd]">
                        <svg className="w-5 h-5 text-[#dfb15b]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <path d="M14 14h2v2h-2zm4 0h3v3h-3zm-4 4h3v3h-3zm4 1h2v2h-2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[#2d1e18] text-xs font-black">UPI Direct Scan & Pay QR</p>
                        <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Scan from desktop or upload verification screenshot</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 uppercase tracking-wider font-extrabold">QR Code</span>
                  </button>

                  {/* Cash on Delivery Card */}
                  <button 
                    onClick={() => {
                      setPaymentMethod("cash_on_delivery");
                      setUpiApp("");
                      setIsDirectQrPayment(false);
                    }}
                    className={`w-full p-4 rounded-2xl border text-xs font-extrabold flex justify-between items-center transition duration-300 ${paymentMethod === "cash_on_delivery" ? "bg-[#f6eedc]/55 border-[#dfb15b] shadow-[0_0_12px_rgba(223,177,91,0.2)]" : "bg-white border-[#efe3d3]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f4faf2] flex items-center justify-center border border-[#dcefd4]">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="3" />
                          <path d="M6 12h.01M18 12h.01" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[#2d1e18] text-xs font-black">Cash on Delivery</p>
                        <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Pay cash at your doorstep. ₹9 Handling Charge applies</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 uppercase tracking-wider font-extrabold">+₹9 fee</span>
                  </button>
                </div>

                {/* Inline QR Scanner and Uploader */}
                {paymentMethod === "upi" && isDirectQrPayment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#faf8f5] border border-[#dfb15b]/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <span className="text-[9px] font-black text-[#dfb15b] uppercase tracking-widest">Direct QR Scan & Pay</span>
                    <div className="bg-white p-3.5 rounded-2xl border-2 border-[#dfb15b] shadow-md">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${merchantUpiId}&pn=Pista%20Bajaar&am=${totalAmount + (giftWrap ? 49 : 0)}&cu=INR&tn=Order%20Payment`)}`} 
                        alt="Payment QR Code" 
                        className="w-40 h-40 object-contain block"
                      />
                    </div>
                    <p className="text-[10px] text-[#72625a] leading-relaxed max-w-[90%]">
                      Scan QR with GPay, PhonePe, Paytm or BHIM to complete your luxury checkout of <strong className="text-[#2d1e18]">₹{totalAmount + (giftWrap ? 49 : 0)}</strong>.
                    </p>

                    {/* Screenshot Upload Container */}
                    <div className="w-full pt-3 border-t border-dashed border-[#efe3d3] text-left">
                      <span className="text-[9px] font-black text-[#2d1e18] uppercase tracking-wider block mb-2">📸 Upload Screenshot Verification</span>
                      {!upiScreenshot ? (
                        <div className="relative border-2 border-dashed border-[#dfb15b] bg-[#dfb15b]/5 rounded-2xl p-4 text-center cursor-pointer hover:bg-[#dfb15b]/10 transition">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setUpiScreenshot(reader.result as string);
                                  showToast("Screenshot uploaded successfully! 📸");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <span className="text-xl block mb-1">📤</span>
                          <p className="text-[10px] font-bold text-[#2d1e18]">Tap to Upload Payment Proof</p>
                          <p className="text-[8px] text-[#72625a] mt-0.5">JPG, PNG formats supported</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-[#efe3d3] justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={upiScreenshot} 
                              alt="Screenshot Preview" 
                              className="w-10 h-14 object-cover rounded-md border border-[#efe3d3]" 
                            />
                            <div className="text-left">
                              <span className="text-[9px] text-emerald-600 font-black flex items-center gap-1">
                                ✓ Uploaded
                              </span>
                              <p className="text-[8px] text-[#72625a]">Instant admin verification active</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setUpiScreenshot("")}
                            className="text-[9px] font-black text-rose-500 uppercase hover:underline p-1"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="p-4 bg-white rounded-3xl border border-[#efe3d3] space-y-1.5 shadow-sm text-xs font-semibold text-[#72625a]">
                  <h4 className="font-extrabold text-[#2d1e18] uppercase tracking-wider mb-2">⭐ Instant UPI Reward</h4>
                  <p>Choose UPI at payment selection to receive a custom unboxing postcard and complimentary organic seed sachet pack in your package box!</p>
                </div>

                <button 
                  onClick={handleConfirmOrder}
                  className="w-full py-4 bg-gradient-to-r from-[#dfb15b] to-[#b88d3d] hover:from-[#cfa054] hover:to-[#aa841c] text-[#1c130f] font-extrabold rounded-2xl text-xs tracking-widest transition shadow-lg uppercase"
                >
                  CONFIRM & PLACE ORDER (₹{totalAmount + (giftWrap ? 49 : 0)})
                </button>
              </motion.div>
            )}

          </div>
        </div>
      )}

      {/* SCREEN 10: ORDER TRACKING & SUCCESS MILESTONES */}
      {currentScreen === "tracking" && activeOrder && (
        <div className="flex flex-col h-full bg-[#faf7f2] z-50 overflow-hidden">
          
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <div>
              <span className="text-[8px] font-bold text-[#dfb15b] uppercase tracking-widest">Live Delivery</span>
              <h2 className="text-xs font-black uppercase tracking-wider">Tracking Order</h2>
            </div>
            <button 
              onClick={() => {
                setCurrentScreen("home");
                setActiveOrder(null);
              }} 
              className="text-xs text-[#dfc7b0] hover:underline"
            >
              Dashboard
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Elegant Success Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white text-center shadow-lg border border-[#dfb15b]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(223,177,91,0.15),transparent_70%)] animate-pulse" />
              <div className="relative z-10 space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#dfb15b] flex items-center justify-center text-xl text-[#120e0d] mx-auto shadow-md">✓</div>
                <h3 className="text-base font-extrabold text-[#dfb15b] uppercase tracking-wider">Order Hand-Sorted!</h3>
                <p className="text-xs text-white/80 max-w-[200px] mx-auto leading-relaxed">Your organic dry fruits are packed in a luxury hermetic vacuum box.</p>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-left">
                  <div>
                    <p className="text-[9px] text-[#a5948b] uppercase tracking-widest">Delivery OTP</p>
                    <p className="text-lg font-black tracking-widest text-[#dfb15b]">{activeOrder.deliveryOtp || "4921"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[#a5948b] uppercase tracking-widest">Estimated ETA</p>
                    <p className="text-xs font-extrabold text-white">19 Mins (Express)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Milestones progress */}
            <div className="p-4 bg-white rounded-3xl border border-[#efe3d3] shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-[#2d1e18] uppercase tracking-wider">Delivery Progress</h4>
              
              <div className="space-y-4 text-xs font-semibold relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#efe3d3]">
                
                {/* Milestone 1 */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-0 w-3 h-3 rounded-full bg-[#40753b] border-2 border-white shadow-sm" />
                  <p className="text-[#2d1e18]">Order Confirmed</p>
                  <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Request verified, signature box initiated</p>
                </div>

                {/* Milestone 2 */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-0 w-3 h-3 rounded-full bg-[#40753b] border-2 border-white shadow-sm" />
                  <p className="text-[#2d1e18]">Packed with Care</p>
                  <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Triple-laser cleaned & premium vacuum sealed</p>
                </div>

                {/* Milestone 3 */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-0 w-3 h-3 rounded-full bg-[#dfb15b] border-2 border-white shadow-sm animate-ping" />
                  <span className="absolute -left-[22px] top-0 w-3 h-3 rounded-full bg-[#dfb15b] border-2 border-white shadow-sm" />
                  <p className="text-[#2d1e18] font-black">Out for Delivery (Express)</p>
                  <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Delivery Executive: Shaurya Kumar (Bandra Hub)</p>
                </div>

                {/* Milestone 4 */}
                <div className="relative opacity-40">
                  <span className="absolute -left-[22px] top-0 w-3 h-3 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                  <p className="text-[#72625a]">Arriving at Doorstep</p>
                  <p className="text-[9px] text-[#72625a] font-normal mt-0.5">Confirm OTP to complete luxury unboxing</p>
                </div>
              </div>
            </div>

            {/* Courier partner details box */}
            <div className="p-3 bg-white border border-[#efe3d3] rounded-2xl flex justify-between items-center text-xs">
              <div className="flex gap-2.5 items-center">
                <span className="text-2xl">🚴</span>
                <div>
                  <p className="font-extrabold text-[#2d1e18]">Shaurya Kumar</p>
                  <p className="text-[9px] text-[#72625a]">Pista Bajaar Certified Express Partner</p>
                </div>
              </div>
              <button 
                onClick={() => showToast("Contacting delivery executive... 📱")} 
                className="py-1.5 px-3 bg-[#2d1e18] text-white text-[9px] font-extrabold rounded-lg tracking-wider"
              >
                CALL PARTNER
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SCREEN 11: WISHLIST */}
      {currentScreen === "wishlist" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Saved Items</h2>
            <button onClick={() => setCurrentScreen("home")} className="text-xs text-[#dfc7b0] hover:underline">Pantry</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <span className="text-5xl">❤️</span>
                <h3 className="text-sm font-extrabold text-[#2d1e18] mt-4">Your Wishlist is empty</h3>
                <p className="text-xs text-[#72625a] max-w-[200px] mt-1">Tap the heart on any dry fruit card to save it for luxury unboxing.</p>
                <button 
                  onClick={() => setCurrentScreen("home")} 
                  className="mt-4 py-2.5 px-5 bg-[#dfb15b] text-[#1c130f] text-[10px] font-extrabold rounded-lg tracking-wider transition"
                >
                  SHOP PANTRY
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {products.filter((p) => wishlist.includes(p.id)).map((prod) => (
                  <div key={prod.id} className="bg-white rounded-3xl border border-[#efe3d3] overflow-hidden flex flex-col shadow-sm relative group hover:border-[#dfb15b]/45 transition">
                    <motion.button 
                      whileTap={{ scale: 1.4 }} 
                      transition={{ type: "spring", stiffness: 500, damping: 10 }}
                      onClick={() => toggleWishlist(prod.id)}
                      className="absolute right-2.5 top-2.5 z-10 w-7 h-7 rounded-full bg-white/80 border border-[#efe3d3] flex items-center justify-center text-[#2d1e18] focus:outline-none"
                    >
                      <HeartIcon 
                        fill={wishlist.includes(prod.id) ? "#ff3b30" : "none"} 
                        stroke={wishlist.includes(prod.id) ? "#ff3b30" : "currentColor"} 
                      />
                    </motion.button>
                    
                    <div 
                      onClick={() => {
                        setSelectedProduct(prod);
                        setCurrentScreen("detail");
                      }}
                      className="aspect-square bg-slate-50 cursor-pointer overflow-hidden"
                    >
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-[#2d1e18] line-clamp-1">{prod.name}</h4>
                        <p className="text-[8px] text-[#72625a] mt-0.5">Pack: 1kg</p>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-black text-[#2d1e18]">₹{prod.pricePerKg}</span>
                        <button 
                          onClick={() => addToCart(prod.id)}
                          className="py-1 px-3 bg-[#2d1e18] hover:bg-[#120e0d] text-white text-[9px] font-extrabold rounded-lg transition"
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 12: OFFERS & COUPONS (SCRATCH CARD INTERACTIVE UI) */}
      {currentScreen === "offers" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Coupons</h2>
            <button onClick={() => setCurrentScreen("home")} className="text-xs text-[#dfc7b0] hover:underline">Pantry</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-black text-[#2d1e18] uppercase tracking-wider">Scratch & Apply Offers</h3>

            <div className="space-y-4">
              {offers.map((off) => (
                <div 
                  key={off.id}
                  className="rounded-3xl border border-[#efe3d3] overflow-hidden bg-white shadow-sm flex flex-col"
                >
                  {/* Luxury Ribbon banner */}
                  <div className="p-4 bg-gradient-to-r from-[#2d1e18] to-[#1e120e] text-white">
                    <span className="text-[8px] font-bold text-[#dfb15b] uppercase tracking-widest block mb-1">Special offer</span>
                    <h4 className="text-sm font-black tracking-tight">{off.title}</h4>
                    <p className="text-[10px] text-white/80 leading-relaxed mt-1">{off.description}</p>
                  </div>

                  <div className="p-4 flex justify-between items-center bg-[#f6eedc]/20">
                    <div>
                      <p className="text-[8px] text-[#72625a] font-bold uppercase tracking-wider">Discount Code</p>
                      <p className="text-xs font-extrabold text-[#2d1e18] mt-0.5 tracking-wider">{off.discountCode || "PISTABAJAARCOMB"}</p>
                    </div>
                    <button 
                      onClick={() => handleApplyCoupon(off)}
                      className="py-2 px-4 bg-[#dfb15b] hover:bg-[#cfa054] text-[#1c130f] text-[10px] font-black rounded-xl tracking-wider transition shadow-sm"
                    >
                      APPLY COUPON
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Scratch Card visual placeholder */}
            <div 
              onClick={() => showToast("Scratch card revealed! Code PISTAGOLD applied! 🪙")} 
              className="p-6 rounded-3xl bg-gradient-to-br from-[#dfb15b] via-[#cfa054] to-[#876221] text-white text-center cursor-pointer shadow-md relative overflow-hidden group border border-[#dfb15b]/20"
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] group-hover:opacity-0 transition duration-500 flex items-center justify-center text-sm font-black uppercase tracking-widest text-[#1c130f]">
                Tap to Scratch Card
              </div>
              <h4 className="text-sm font-extrabold tracking-tight">15% INSTANT CASHBACK</h4>
              <p className="text-[9px] mt-1">Applied to first premium order box above ₹1000</p>
              <p className="text-[11px] font-black mt-3 text-[#1c130f]">CODE: PISTAGOLD</p>
            </div>

          </div>
        </div>
      )}

      {/* SCREEN 13: NOTIFICATIONS / ALERTS */}
      {currentScreen === "notifications" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Alert Inbox</h2>
            <button onClick={() => setCurrentScreen("home")} className="text-xs text-[#dfc7b0] hover:underline">Pantry</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-3.5 bg-white rounded-2xl border border-[#dfb15b]/30 shadow-sm flex gap-3 items-start relative overflow-hidden">
              <span className="text-lg">🎉</span>
              <div>
                <h4 className="text-[10px] font-extrabold text-[#2d1e18] uppercase tracking-wider">Welcome to Pista Bajaar Luxury!</h4>
                <p className="text-[9px] text-[#72625a] mt-1 leading-relaxed">Enjoy hand-sorted dry fruits, complimentary greeting gift box note cards, and 15-20 min quick-commerce unboxing.</p>
                <p className="text-[8px] text-[#72625a]/60 mt-1.5 font-bold uppercase tracking-wider">Just Now</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#efe3d3] shadow-sm flex gap-3 items-start">
              <span className="text-lg">🚴</span>
              <div>
                <h4 className="text-[10px] font-extrabold text-[#2d1e18] uppercase tracking-wider">Express Delivery Expansion</h4>
                <p className="text-[9px] text-[#72625a] mt-1 leading-relaxed">Express 19-minute deliveries are now active in your pin code area in Mumbai!</p>
                <p className="text-[8px] text-[#72625a]/60 mt-1.5 font-bold uppercase tracking-wider">2 Hours Ago</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 14: USER PROFILE */}
      {currentScreen === "profile" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Profile</h2>
            <button onClick={() => setCurrentScreen("home")} className="text-xs text-[#dfc7b0] hover:underline">Pantry</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Profile card element */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2d1e18] via-[#1e120e] to-black text-white border border-[#dfb15b]/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#dfb15b]/10 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-bold text-[#dfb15b] uppercase tracking-widest bg-[#dfb15b]/10 px-2 py-0.5 rounded-full">Pista Bajaar Account</span>
                  <h3 className="text-base font-black tracking-tight mt-2">{customerName || "Customer Name"}</h3>
                  <p className="text-[10px] text-white/60 mt-0.5 font-medium">{phone}</p>
                </div>
                <span className="text-3xl">⚜️</span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[8px] text-[#a5948b] uppercase tracking-widest">Account Type</p>
                  <p className="font-extrabold text-[#dfb15b] mt-0.5">CUSTOMER</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-[#a5948b] uppercase tracking-widest">Pista Bajaar Wallet Savings</p>
                  <p className="font-extrabold text-white mt-0.5">₹{totalSavings}</p>
                </div>
              </div>
            </div>

            {/* Profile Action items */}
            <div className="bg-white rounded-3xl border border-[#efe3d3] shadow-sm divide-y divide-[#efe3d3] text-xs font-semibold text-[#2d1e18]">
              
              <button 
                onClick={() => setCurrentScreen("history")}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50 text-left"
              >
                <span>📦 Luxury Order History</span>
                <span className="text-slate-400">›</span>
              </button>

              <button 
                onClick={() => setCurrentScreen("checkout")}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50 text-left"
              >
                <span>🏡 Address Management</span>
                <span className="text-slate-400">›</span>
              </button>

              <button 
                onClick={() => setCurrentScreen("offers")}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50 text-left"
              >
                <span>🎟️ Active Scratch-Card Coupons</span>
                <span className="text-slate-400">›</span>
              </button>
            </div>

            <button 
              onClick={() => {
                localStorage.removeItem("pistabajaar_phone");
                localStorage.removeItem("pistabajaar_name");
                setIsLoggedIn(false);
                setPhone("");
                setCustomerName("");
                setCurrentScreen("login");
              }}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-[#8f2419] font-extrabold rounded-2xl text-xs tracking-wider transition border border-[#efe3d3] text-center"
            >
              LOGOUT ACCOUNT
            </button>

          </div>
        </div>
      )}

      {/* SCREEN 15: ORDER HISTORY */}
      {currentScreen === "history" && (
        <div className="premium-screen-container">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center justify-between shadow">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#dfb15b]">Order History</h2>
            <button onClick={() => setCurrentScreen("profile")} className="text-xs text-[#dfc7b0] hover:underline">Profile</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {myOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <span className="text-5xl">📦</span>
                <h3 className="text-sm font-extrabold text-[#2d1e18] mt-4">No Orders yet</h3>
                <p className="text-xs text-[#72625a] max-w-[200px] mt-1">Your luxury dry fruit unboxing history will display here.</p>
                <button 
                  onClick={() => setCurrentScreen("home")} 
                  className="mt-4 py-2.5 px-5 bg-[#dfb15b] text-[#1c130f] text-[10px] font-extrabold rounded-lg tracking-wider transition"
                >
                  ACQUIRE LUXURY SELECTIONS
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((ord) => (
                  <div 
                    key={ord.id}
                    className="p-4 bg-white rounded-3xl border border-[#efe3d3] shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#72625a]">
                      <span>ORDER ID: {ord.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-[9px] bg-[#40753b]/10 text-[#40753b] px-2 py-0.5 rounded-full uppercase">{ord.status}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {ord.items.map((item, idx) => (
                        <p key={idx} className="text-[#2d1e18] font-semibold">{item.name} ({item.quantityKg}kg)</p>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-[#efe3d3] flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[9px] text-[#72625a]">Grand Total Paid</p>
                        <p className="font-black text-[#2d1e18]">₹{ord.totalAmount}</p>
                      </div>
                      <button 
                        onClick={() => {
                          showToast("Reordering premium items... 🛒");
                          ord.items.forEach((item) => {
                            setCart((prev) => ({ ...prev, [item.productId]: item.quantityKg }));
                          });
                          setCurrentScreen("cart");
                        }}
                        className="py-1.5 px-3 bg-[#2d1e18] text-white text-[9px] font-extrabold rounded-lg tracking-wider"
                      >
                        REORDER ITEMS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH INTERACTIVE MODAL OVERLAY */}
      {isSearchActive && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col overflow-hidden">
          <div className="p-4 pt-12 bg-gradient-to-r from-[#2d1e18] to-[#120e0d] text-white flex items-center gap-3">
            <button 
              onClick={() => setIsSearchActive(false)} 
              className="text-white text-base font-extrabold pr-2"
            >
              ‹
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium dry fruits..." 
                className="w-full py-2.5 pl-4 pr-10 rounded-xl bg-white text-[#2d1e18] placeholder-black/40 outline-none text-xs font-semibold"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              onClick={handleVoiceSearch} 
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
            >
              🎙️
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Smart suggestions triggers */}
            {!searchQuery && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#72625a] uppercase tracking-wider">Smart Suggestions</h4>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-[#2d1e18]">
                  {["Kashmir Saffron", "Raw Almonds", "Ivory Cashews", "Emerald Pistachios", "Gourmet Berries Mix", "Festive Hamper"].map((sug) => (
                    <button 
                      key={sug}
                      onClick={() => setSearchQuery(sug)}
                      className="py-1.5 px-3.5 bg-[#f6eedc]/55 border border-[#efe3d3] rounded-full hover:border-[#dfb15b]"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtered suggestions list */}
            {searchQuery && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-[#72625a] uppercase tracking-wider">Search Results</h4>
                {filteredProducts.map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setIsSearchActive(false);
                      setCurrentScreen("detail");
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-[#faf7f2] border border-[#efe3d3] flex gap-3 items-center hover:border-[#dfb15b]"
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-extrabold text-[#2d1e18]">{p.name}</p>
                      <p className="text-[9px] text-[#72625a] mt-0.5">₹{p.pricePerKg} / kg</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 18. bottom navigation bar (Universal Mobile bottom strip) */}
      {currentScreen !== "splash" && 
       currentScreen !== "onboarding" && 
       currentScreen !== "login" && 
       currentScreen !== "detail" && 
       currentScreen !== "checkout" && 
       currentScreen !== "tracking" && (
        <div className="premium-bottom-nav">
          <button 
            onClick={() => {
              setCategory("all");
              setSearchQuery("");
              setCurrentScreen("home");
            }}
            className={`flex flex-col items-center justify-center w-12 h-12 transition ${currentScreen === "home" ? "text-[#dfb15b]" : "text-[#72625a] opacity-75 hover:opacity-100"}`}
          >
            <HomeIcon />
            <span className="text-[8px] font-extrabold mt-1 uppercase tracking-wide">Pantry</span>
          </button>

          <button 
            onClick={() => setCurrentScreen("categories")}
            className={`flex flex-col items-center justify-center w-12 h-12 transition ${currentScreen === "categories" ? "text-[#dfb15b]" : "text-[#72625a] opacity-75 hover:opacity-100"}`}
          >
            <GiftIcon />
            <span className="text-[8px] font-extrabold mt-1 uppercase tracking-wide">Explore</span>
          </button>

          <button 
            onClick={() => setCurrentScreen("wishlist")}
            className={`flex flex-col items-center justify-center w-12 h-12 transition ${currentScreen === "wishlist" ? "text-[#dfb15b]" : "text-[#72625a] opacity-75 hover:opacity-100"}`}
          >
            <HeartIcon fill={currentScreen === "wishlist" ? "#dfb15b" : "none"} />
            <span className="text-[8px] font-extrabold mt-1 uppercase tracking-wide">Saved</span>
          </button>

          <button 
            onClick={() => setCurrentScreen("cart")}
            className={`flex flex-col items-center justify-center w-12 h-12 transition relative ${currentScreen === "cart" ? "text-[#dfb15b]" : "text-[#72625a] opacity-75 hover:opacity-100"}`}
          >
            <CartIcon />
            <span className="text-[8px] font-extrabold mt-1 uppercase tracking-wide">Cart</span>
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-2.5 w-4 h-4 bg-[#2d1e18] text-[#dfb15b] border border-[#dfb15b]/20 rounded-full text-[8px] font-black flex items-center justify-center shadow-md">
                {cartItems.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setCurrentScreen("profile")}
            className={`flex flex-col items-center justify-center w-12 h-12 transition ${currentScreen === "profile" ? "text-[#dfb15b]" : "text-[#72625a] opacity-75 hover:opacity-100"}`}
          >
            <ProfileIcon />
            <span className="text-[8px] font-extrabold mt-1 uppercase tracking-wide">Profile</span>
          </button>
        </div>
      )}

    </div>
  );
}
