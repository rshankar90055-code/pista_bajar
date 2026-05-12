"use client";

import { useEffect, useState } from "react";
import type { SavedAddress } from "@/lib/types";

const emptyForm = {
  name: "",
  contactPhone: "",
  addressLine: "",
  city: "",
  pinCode: "",
  landmark: "",
  isDefault: false
};

export default function AddressesPage() {
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem("druits_phone") ?? "";
    setPhone(savedPhone);
    setForm((current) => ({ ...current, contactPhone: savedPhone }));
    if (savedPhone) void loadAddresses(savedPhone);
  }, []);

  async function loadAddresses(nextPhone = phone) {
    if (!nextPhone) return;
    const response = await fetch(`/api/addresses?phone=${encodeURIComponent(nextPhone)}`);
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not load addresses.");
      return;
    }
    setAddresses(data.addresses ?? []);
  }

  function editAddress(address: SavedAddress) {
    setEditingId(address.id);
    setForm({
      name: address.name,
      contactPhone: address.contactPhone,
      addressLine: address.addressLine,
      city: address.city,
      pinCode: address.pinCode,
      landmark: address.landmark,
      isDefault: address.isDefault
    });
  }

  function resetForm() {
    setEditingId("");
    setForm({ ...emptyForm, contactPhone: phone });
    setSelectedLocation(null);
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
        setForm((current) => ({
          ...current,
          landmark: `Map pin: ${lat}, ${lng}`
        }));
        setToast("Live location added to landmark.");
      },
      () => setToast("Could not access your live location.")
    );
  }

  async function saveAddress() {
    const payload = { ...form, phone, addressId: editingId };
    const response = await fetch("/api/addresses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not save address.");
      return;
    }
    setToast(editingId ? "Address updated." : "Address added.");
    resetForm();
    await loadAddresses();
  }

  async function setDefault(address: SavedAddress) {
    const response = await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...address, phone, addressId: address.id, isDefault: true })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not set default.");
      return;
    }
    setToast("Default address updated.");
    await loadAddresses();
  }

  async function deleteAddress(addressId: string) {
    const response = await fetch(`/api/addresses?phone=${encodeURIComponent(phone)}&addressId=${encodeURIComponent(addressId)}`, {
      method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not delete address.");
      return;
    }
    setToast("Address deleted.");
    await loadAddresses();
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

      <section className="layout-grid section">
        <div className="panel">
          <div className="section-head">
            <div>
              <h1>Addresses</h1>
              <p className="muted">{phone ? "Saved delivery addresses for faster checkout." : "Login on the storefront to manage addresses."}</p>
            </div>
          </div>
          <div className="address-list">
            {addresses.map((address) => (
              <article className={`address-card ${address.isDefault ? "selected" : ""}`} key={address.id}>
                <div>
                  <strong>{address.name}</strong>
                  {address.isDefault ? <span className="status">Default</span> : null}
                </div>
                <p className="muted">{address.contactPhone}</p>
                <p>
                  {address.addressLine}, {address.city} {address.pinCode}
                </p>
                {address.landmark ? <p className="muted">Landmark: {address.landmark}</p> : null}
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => editAddress(address)}>
                    Edit
                  </button>
                  <button className="button ghost" type="button" onClick={() => setDefault(address)} disabled={address.isDefault}>
                    Default
                  </button>
                  <button className="button danger" type="button" onClick={() => deleteAddress(address.id)} disabled={address.isDefault}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {!addresses.length ? <p className="muted">No saved addresses yet.</p> : null}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <h2>{editingId ? "Edit address" : "Add address"}</h2>
            </div>
            {editingId ? (
              <button className="button ghost" type="button" onClick={resetForm}>
                New
              </button>
            ) : null}
          </div>
          <div className="form">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="contactPhone">Phone</label>
              <input id="contactPhone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="addressLine">Address line</label>
              <textarea id="addressLine" rows={3} value={form.addressLine} onChange={(event) => setForm({ ...form, addressLine: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pinCode">Pin code</label>
              <input id="pinCode" value={form.pinCode} onChange={(event) => setForm({ ...form, pinCode: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="landmark">Landmark</label>
              <div className="location-field">
                <input id="landmark" value={form.landmark} onChange={(event) => setForm({ ...form, landmark: event.target.value })} />
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
              <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
              <span>Use as default delivery address</span>
            </label>
            <button className="button" type="button" onClick={saveAddress} disabled={!phone}>
              {editingId ? "Save address" : "Add address"}
            </button>
          </div>
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
