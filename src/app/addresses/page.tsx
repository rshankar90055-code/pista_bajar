"use client";

import { useEffect, useState } from "react";
import type { SavedAddress } from "@/lib/types";

const emptyForm = {
  name: "",
  contactPhone: "",
  addressLine: "",
  city: "",
  pinCode: "",
  isDefault: false
};

export default function AddressesPage() {
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("pistabajaar_phone") ?? "";
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
      isDefault: address.isDefault
    });
  }

  function resetForm() {
    setEditingId("");
    setForm({ ...emptyForm, contactPhone: phone });
  }

  async function saveAddress() {
    if (!phone || busyAction) return;
    if (!form.name.trim() || !form.contactPhone.trim() || !form.addressLine.trim() || !form.city.trim() || !form.pinCode.trim()) {
      setToast("Please fill name, phone, full address, city, and pin code.");
      return;
    }

    setBusyAction("save");
    try {
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
    } catch {
      setToast("Could not save address. Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  async function setDefault(address: SavedAddress) {
    if (busyAction) return;
    setBusyAction(`default-${address.id}`);
    try {
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
    } catch {
      setToast("Could not set default. Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteAddress(addressId: string) {
    if (busyAction) return;
    setBusyAction(`delete-${addressId}`);
    try {
      const response = await fetch(`/api/addresses?phone=${encodeURIComponent(phone)}&addressId=${encodeURIComponent(addressId)}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok) {
        setToast(data.error ?? "Could not delete address.");
        return;
      }
      setAddresses((current) => current.filter((address) => address.id !== addressId));
      setToast("Address deleted.");
      await loadAddresses();
    } catch {
      setToast("Could not delete address. Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" style={{ background: 'linear-gradient(135deg, #dfb15b, #b88d3d)', borderRadius: '8px', color: '#1c130f', fontWeight: 'bold', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
            <img src="/pistabajaar-logo.png" alt="P" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </span>
          <span>Pista Bajaar</span>
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
                <div className="address-actions">
                  <button className="button secondary" type="button" onClick={() => editAddress(address)}>
                    Edit
                  </button>
                  {!address.isDefault ? (
                    <button className="button ghost" type="button" onClick={() => setDefault(address)} disabled={busyAction === `default-${address.id}`}>
                      {busyAction === `default-${address.id}` ? "Setting..." : "Set default"}
                    </button>
                  ) : null}
                  <button className="button danger" type="button" onClick={() => deleteAddress(address.id)} disabled={busyAction === `delete-${address.id}`}>
                    {busyAction === `delete-${address.id}` ? "Deleting..." : "Delete"}
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
              <textarea
                id="addressLine"
                rows={4}
                placeholder="Paste your accurate full address or Google Maps copied location here."
                value={form.addressLine}
                onChange={(event) => setForm({ ...form, addressLine: event.target.value })}
              />
              <small className="field-help">Please paste the complete Google Maps address/location here for accurate delivery.</small>
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pinCode">Pin code</label>
              <input id="pinCode" value={form.pinCode} onChange={(event) => setForm({ ...form, pinCode: event.target.value })} />
            </div>
            <label className="check-row">
              <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
              <span>Use as default delivery address</span>
            </label>
            <button className="button" type="button" onClick={saveAddress} disabled={!phone || busyAction === "save"}>
              {busyAction === "save" ? "Saving..." : editingId ? "Save address" : "Add address"}
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
