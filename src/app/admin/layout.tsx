"use client";

import React, { useState } from "react";
import { AdminProvider, useAdmin } from "./admin-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthed, login, logout, toast, setToast, notifications } = useAdmin();
  const [passInput, setPassInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pathname = usePathname();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passInput) return;
    setLoading(true);
    setErrorMsg("");
    const ok = await login(passInput);
    setLoading(false);
    if (!ok) {
      setErrorMsg("Invalid credentials. Please try again.");
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#05140c] via-[#0b2416] to-[#04100a] text-white p-4 font-sans selection:bg-[#dfb15b]/30">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#dfb15b]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#40753b]/10 rounded-full blur-3xl" />

        <div className="relative w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#dfb15b] to-[#c89b3c] p-3 shadow-lg">
              <img src="/pistabajar-logo.png" alt="P" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-white">PISTA BAJAR</h1>
            <p className="text-xs text-[#a5948b] tracking-wider uppercase font-semibold">Security Command Center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#a5948b] uppercase tracking-widest">Admin Passcode</label>
              <input
                type="password"
                placeholder="Enter password..."
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="w-full py-3 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 text-sm font-semibold focus:outline-none focus:border-[#dfb15b] transition-colors"
                autoFocus
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-semibold bg-red-950/20 border border-red-500/10 py-2.5 px-3 rounded-lg text-center">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#dfb15b] text-[#1c130f] hover:bg-[#c89b3c] active:scale-[0.98] transition font-bold text-xs rounded-xl tracking-widest uppercase shadow-lg shadow-[#dfb15b]/10"
            >
              {loading ? "Authenticating..." : "Establish Secure Session"}
            </button>
          </form>

          <p className="text-[9px] text-[#a5948b]/50 text-center uppercase tracking-wider mt-4">
            Authorized Personnel Only · Local Default: admin123
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: "📊" },
    { label: "Orders", href: "/admin/orders", icon: "📦", badge: unreadNotifications.length || undefined },
    { label: "Products", href: "/admin/products", icon: "🌰" },
    { label: "Customers", href: "/admin/customers", icon: "👥" },
    { label: "Coupons", href: "/admin/coupons", icon: "🎟️" },
    { label: "Analytics", href: "/admin/analytics", icon: "📈" }
  ];

  return (
    <div className="min-h-screen bg-[#05120a] text-[#e3ded9] flex flex-col md:flex-row font-sans">
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3.5 bg-gradient-to-r from-[#1c130f] to-[#120e0d] border border-[#dfb15b]/30 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold tracking-wide animate-slide-in backdrop-blur-md">
          <span className="text-[#dfb15b]">✦</span>
          <span>{toast}</span>
          <button onClick={() => setToast("")} className="ml-2 font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#091a10] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#dfb15b] to-[#c89b3c] flex items-center justify-center p-1 text-black font-bold">
                <img src="/pistabajar-logo.png" alt="P" className="w-full h-full object-contain" />
              </span>
              <span className="font-black text-sm tracking-wider text-white uppercase">Bajar Admin</span>
            </Link>
            <Link href="/" className="text-[10px] bg-[#dfb15b]/10 text-[#dfb15b] hover:bg-[#dfb15b]/20 px-2 py-1 rounded-md font-extrabold uppercase tracking-wide">
              Site ↗
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#dfb15b]/20 to-transparent text-[#dfb15b] border-l-2 border-[#dfb15b]"
                      : "text-[#a5948b] hover:bg-white/[0.02] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-sm opacity-90">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span className="bg-[#dfb15b] text-[#1c130f] px-2 py-0.5 rounded-full text-[9px] font-black">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User logout section */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">
              👑
            </div>
            <div>
              <p className="text-[10px] font-bold text-white uppercase">System Root</p>
              <p className="text-[9px] text-[#a5948b]">Console Admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 flex items-center justify-center text-xs transition"
            title="Log Out"
          >
            🔌
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
