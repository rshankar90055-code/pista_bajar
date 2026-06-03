"use client";

import { useEffect, useState } from "react";
import type { Offer, SavedAddress } from "@/lib/types";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const savedPhone = localStorage.getItem("pistabajaar_phone") ?? "";
    const savedName = localStorage.getItem("pistabajaar_name") ?? "";
    setPhone(savedPhone);
    setName(savedName);

    if (savedPhone) {
      void fetch(`/api/addresses?phone=${encodeURIComponent(savedPhone)}`)
        .then((response) => response.json())
        .then((data) => setAddresses(data.addresses ?? []));
      void fetch(`/api/savings?phone=${encodeURIComponent(savedPhone)}`)
        .then((response) => response.json())
        .then((data) => setTotalSavings(Number(data.totalSavings ?? 0)));
    }

    void fetch("/api/offers")
      .then((response) => response.json())
      .then((data) => setOffers(data.offers ?? []));
  }, []);

  function signOut() {
    localStorage.removeItem("pistabajaar_phone");
    localStorage.removeItem("pistabajaar_name");
    window.location.href = "/";
  }

  return (
    <main className="profile-page">
      <div className="profile-hero">
        <a className="profile-back" href="/" aria-label="Back to home">
          ‹
        </a>
        <div className="profile-avatar">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 22a8 8 0 0 1 16 0" />
          </svg>
        </div>
        <h1>{name || "Guest user"}</h1>
        <p>{phone || "Login to view phone number"}</p>
      </div>

      <section className="profile-shortcuts" aria-label="Profile shortcuts">
        <a href="/orders">
          <span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </span>
          Orders
        </a>
        <a href="/coupons">
          <span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M19 5 5 19" />
              <circle cx="7" cy="7" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </span>
          Offers
        </a>
        <a href="/help">
          <span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 1 1 5.8 1c-.8 1.4-2.9 1.4-2.9 3" />
              <path d="M12 17h.01" />
            </svg>
          </span>
          Help
        </a>
      </section>

      <section className="profile-meter">
        You Saved
        <strong>₹{totalSavings}</strong>
        <small>till now</small>
      </section>

      <section className="profile-section">
        <a className="profile-row" href="/addresses">
          <span className="row-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 21s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </span>
          <span>
            <strong>Delivery Addresses</strong>
            <small>{addresses.length} saved address{addresses.length === 1 ? "" : "es"}</small>
          </span>
          <em>›</em>
        </a>
      </section>

      <h2 id="help" className="profile-section-title">Help</h2>
      <section className="profile-section">
        <a className="profile-row" href="/help">
          <span className="row-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
          </span>
          <span>
            <strong>Contact</strong>
            <small>+91 95388069498</small>
          </span>
          <em>›</em>
        </a>
      </section>

      <h2 className="profile-section-title">More Information</h2>
      <section className="profile-section">
        <div className="profile-row">
          <span className="row-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </span>
          <span>
            <strong>About Pista Bajaar</strong>
          </span>
          <em>›</em>
        </div>
        <div className="profile-row">
          <span className="row-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8" />
              <path d="M8 17h8" />
            </svg>
          </span>
          <span>
            <strong>Legal Information</strong>
          </span>
          <em>›</em>
        </div>
        <div className="profile-row">
          <span className="row-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            </svg>
          </span>
          <span>
            <strong>Privacy Policy</strong>
          </span>
          <em>›</em>
        </div>
      </section>

      <button className="signout-button" type="button" onClick={signOut}>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 2v10" />
          <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
        </svg>
        Sign out
      </button>

    </main>
  );
}
