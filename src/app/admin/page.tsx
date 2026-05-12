"use client";

import { useEffect, useState } from "react";
import type { AppNotification, Offer, Order, OrderStatus, Product, ProductCategory } from "@/lib/types";

const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  cancelled: "Cancelled",
  shiprocket_pickup: "Picked up by Shiprocket",
  delivered: "Delivered"
};

const categories: ProductCategory[] = ["almonds", "cashews", "pistachios", "dates", "raisins", "walnuts", "figs"];

function formatDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  return `${day}-${month}-${year}`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [editingProductId, setEditingProductId] = useState("");
  const [editingOfferId, setEditingOfferId] = useState("");
  const [seenAdminNotificationIds, setSeenAdminNotificationIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [offer, setOffer] = useState({
    title: "",
    description: "",
    expiryDate: "",
    discountCode: "",
    extraItemText: "",
    autoAddItems: [] as Array<{ productId: string; quantityKg: number }>,
    active: true
  });
  const [product, setProduct] = useState({
    name: "",
    imageUrl: "",
    videoUrl: "",
    pricePerKg: "",
    category: "almonds" as ProductCategory,
    description: "",
    stockKg: "20",
    soldOut: false,
    featured: false
  });

  const editingProduct = products.find((entry) => entry.id === editingProductId) ?? null;
  const editingOffer = offers.find((entry) => entry.id === editingOfferId) ?? null;

  async function pollAdminNotifications() {
    if (!isAuthed) return;
    const response = await fetch(`/api/notifications?audience=admin&adminPassword=${encodeURIComponent(password)}`);
    const data = (await response.json()) as { notifications?: AppNotification[] };
    const unread = (data.notifications ?? []).filter((entry) => !entry.read && !seenAdminNotificationIds.has(entry.id));
    if (!unread.length) return;

    setSeenAdminNotificationIds((current) => new Set([...current, ...unread.map((entry) => entry.id)]));
    const latest = unread[0];
    setToast(`${latest.title}: ${latest.message}`);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread.map((entry) => entry.id) })
    });
  }

  useEffect(() => {
    if (!isAuthed) return;
    void pollAdminNotifications();
    const interval = window.setInterval(pollAdminNotifications, 10000);
    return () => window.clearInterval(interval);
  }, [isAuthed, password, seenAdminNotificationIds]);

  async function loadOrders(nextPassword = password) {
    const response = await fetch(`/api/orders?adminPassword=${encodeURIComponent(nextPassword)}`);
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error);
      return;
    }
    setOrders(data.orders ?? []);
    setIsAuthed(true);
    await loadProducts();
    await loadOffers();
  }

  async function loadProducts() {
    const response = await fetch("/api/products");
    const data = await response.json();
    setProducts(data.products ?? []);
  }

  async function loadOffers() {
    const response = await fetch("/api/offers?includeInactive=true");
    const data = await response.json();
    setOffers(data.offers ?? []);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const response = await fetch("/api/update-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, adminPassword: password })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error);
      return;
    }
    setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
    setToast("Order status updated.");
  }

  async function sendToShiprocket(order: Order) {
    const response = await fetch("/api/shiprocket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, order })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Shiprocket mock failed.");
      return;
    }
    setToast(data.message);
    await updateStatus(order.id, "shiprocket_pickup");
  }

  async function createOffer() {
    const response = await fetch("/api/create-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...offer, adminPassword: password })
    });
    const data = (await response.json()) as { offer?: Offer; error?: string };
    if (!response.ok) {
      setToast(data.error ?? "Could not create offer.");
      return;
    }
    setOffer({ title: "", description: "", expiryDate: "", discountCode: "", extraItemText: "", autoAddItems: [], active: true });
    setToast(`Offer announced: ${data.offer?.title}`);
    await loadOffers();
  }

  function startOfferEdit(selectedOffer: Offer) {
    setEditingOfferId(selectedOffer.id);
    setOffer({
      title: selectedOffer.title,
      description: selectedOffer.description,
      expiryDate: selectedOffer.expiryDate,
      discountCode: selectedOffer.discountCode ?? "",
      extraItemText: selectedOffer.extraItemText ?? "",
      autoAddItems: selectedOffer.autoAddItems ?? [],
      active: selectedOffer.active
    });
  }

  function resetOfferForm() {
    setEditingOfferId("");
    setOffer({ title: "", description: "", expiryDate: "", discountCode: "", extraItemText: "", autoAddItems: [], active: true });
  }

  function addOfferAutoItem() {
    const firstProduct = products[0];
    if (!firstProduct) {
      setToast("Add a product before configuring coupon auto-add items.");
      return;
    }

    setOffer((current) => ({
      ...current,
      autoAddItems: [...current.autoAddItems, { productId: firstProduct.id, quantityKg: 1 }]
    }));
  }

  function updateOfferAutoItem(index: number, updates: Partial<{ productId: string; quantityKg: number }>) {
    setOffer((current) => ({
      ...current,
      autoAddItems: current.autoAddItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item))
    }));
  }

  function removeOfferAutoItem(index: number) {
    setOffer((current) => ({
      ...current,
      autoAddItems: current.autoAddItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function saveOfferUpdates() {
    if (!editingOfferId) {
      await createOffer();
      return;
    }

    const response = await fetch("/api/update-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: editingOfferId,
        ...offer,
        adminPassword: password
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not update offer.");
      return;
    }

    setOffers((current) => current.map((entry) => (entry.id === editingOfferId ? data.offer : entry)));
    setToast(`Offer updated: ${data.offer.title}`);
  }

  async function deleteOffer(offerId: string) {
    const confirmed = window.confirm("Delete this offer?");
    if (!confirmed) return;

    const response = await fetch("/api/delete-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, adminPassword: password })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not delete offer.");
      return;
    }

    setOffers((current) => current.filter((entry) => entry.id !== offerId));
    if (editingOfferId === offerId) resetOfferForm();
    setToast("Offer deleted.");
  }

  async function createProduct() {
    const response = await fetch("/api/create-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...product,
        pricePerKg: Number(product.pricePerKg),
        adminPassword: password
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not add product.");
      return;
    }

    setProduct({
      name: "",
      imageUrl: "",
      videoUrl: "",
      pricePerKg: "",
      category: "almonds",
      description: "",
      stockKg: "20",
      soldOut: false,
      featured: false
    });
    setToast(`Product added: ${data.product.name}`);
    await loadProducts();
  }

  function startProductEdit(selectedProduct: Product) {
    setEditingProductId(selectedProduct.id);
    setProduct({
      name: selectedProduct.name,
      imageUrl: selectedProduct.imageUrl,
      videoUrl: selectedProduct.videoUrl ?? "",
      pricePerKg: String(selectedProduct.pricePerKg),
      category: selectedProduct.category,
      description: selectedProduct.description,
      stockKg: String(selectedProduct.stockKg ?? 20),
      soldOut: Boolean(selectedProduct.soldOut),
      featured: Boolean(selectedProduct.featured)
    });
  }

  function resetProductForm() {
    setEditingProductId("");
    setProduct({
      name: "",
      imageUrl: "",
      videoUrl: "",
      pricePerKg: "",
      category: "almonds",
      description: "",
      stockKg: "20",
      soldOut: false,
      featured: false
    });
  }

  async function saveProductUpdates() {
    if (!editingProductId) {
      await createProduct();
      return;
    }

    const response = await fetch("/api/update-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: editingProductId,
        ...product,
        pricePerKg: Number(product.pricePerKg),
        stockKg: Number(product.stockKg),
        adminPassword: password
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not update product.");
      return;
    }

    setProducts((current) => current.map((entry) => (entry.id === editingProductId ? data.product : entry)));
    setToast(`Product updated: ${data.product.name}`);
  }

  async function deleteProduct(productId: string) {
    const confirmed = window.confirm("Delete this product from the storefront?");
    if (!confirmed) return;

    const response = await fetch("/api/delete-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, adminPassword: password })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error ?? "Could not delete product.");
      return;
    }

    setProducts((current) => current.filter((entry) => entry.id !== productId));
    if (editingProductId === productId) resetProductForm();
    setToast("Product deleted.");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">D</span>
          <span>Druits Admin</span>
        </a>
        <a className="button ghost" href="/">
          Storefront
        </a>
      </header>

      {!isAuthed ? (
        <section className="panel">
          <h2>Admin login</h2>
          <p className="muted">Use the local password: admin123</p>
          <div className="form">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="button" type="button" onClick={() => loadOrders()}>
              Open dashboard
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="section layout-grid">
            <div className="panel">
              <div className="section-head">
                <div>
                  <h2>Orders</h2>
                  <p>Review, send mock pickups, and mark delivery status.</p>
                </div>
                <button className="button ghost" type="button" onClick={() => loadOrders()}>
                  Refresh
                </button>
              </div>

              <div className="admin-table">
                {orders.length ? (
                  orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="section-head">
                        <div>
                          <strong>{order.userPhone}</strong>
                          <p className="muted">
                            {order.address.addressLine}, {order.address.city} {order.address.pinCode}
                          </p>
                        </div>
                        <span className="status">{statusLabels[order.status]}</span>
                      </div>
                      <div>
                        {order.items.map((item) => (
                          <p className="muted" key={`${order.id}-${item.productId}`}>
                            {item.name}: {item.quantityKg}kg · ₹{item.lineTotal}
                          </p>
                        ))}
                      </div>
                      <strong>Total: ₹{order.totalAmount}</strong>
                      <p className="muted">
                        Payment: {order.paymentMethod?.replaceAll("_", " ") ?? "Not selected"} · {order.paymentStatus ?? "pending"}
                      </p>
                      {order.discountCode ? (
                        <p className="coupon-line">
                          Coupon: {order.discountCode}
                          {order.offerTitle ? ` · ${order.offerTitle}` : ""} · Discount ₹{order.discountAmount ?? 0}
                        </p>
                      ) : (
                        <p className="muted">Coupon: Not used</p>
                      )}
                      <p className="muted">Ordered {new Date(order.timestamp).toLocaleString()}</p>
                      <div className="nav-actions">
                        <button className="button secondary" type="button" onClick={() => sendToShiprocket(order)}>
                          Send to Shiprocket
                        </button>
                        <button className="button ghost" type="button" onClick={() => updateStatus(order.id, "shiprocket_pickup")}>
                          Mark picked up
                        </button>
                        <button className="button" type="button" onClick={() => updateStatus(order.id, "delivered")}>
                          Mark delivered
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="muted">No orders yet.</p>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="panel">
                <div className="section-head">
                  <div>
                    <h2>{editingProduct ? "Update product" : "Add product"}</h2>
                    <p className="muted">Manage product media, price, stock, and customer-facing status.</p>
                  </div>
                  {editingProduct ? (
                    <button className="button ghost" type="button" onClick={resetProductForm}>
                      New
                    </button>
                  ) : null}
                </div>
                <div className="form">
                  <div className="field">
                    <label htmlFor="productName">Product name</label>
                    <input id="productName" value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="productImage">Image URL</label>
                    <input
                      id="productImage"
                      placeholder="https://..."
                      value={product.imageUrl}
                      onChange={(event) => setProduct({ ...product, imageUrl: event.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="productVideo">Video URL</label>
                    <input
                      id="productVideo"
                      placeholder="https://...mp4"
                      value={product.videoUrl}
                      onChange={(event) => setProduct({ ...product, videoUrl: event.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="productPrice">Price per kg</label>
                    <input
                      id="productPrice"
                      inputMode="decimal"
                      placeholder="980"
                      value={product.pricePerKg}
                      onChange={(event) => setProduct({ ...product, pricePerKg: event.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="productCategory">Category</label>
                    <select
                      id="productCategory"
                      value={product.category}
                      onChange={(event) => setProduct({ ...product, category: event.target.value as ProductCategory })}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="productStock">Stock in kg</label>
                    <input
                      id="productStock"
                      inputMode="decimal"
                      placeholder="6"
                      value={product.stockKg}
                      onChange={(event) => setProduct({ ...product, stockKg: event.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="productDescription">Description</label>
                    <textarea
                      id="productDescription"
                      rows={3}
                      value={product.description}
                      onChange={(event) => setProduct({ ...product, description: event.target.value })}
                    />
                  </div>
                  <label className="check-row">
                    <input type="checkbox" checked={product.soldOut} onChange={(event) => setProduct({ ...product, soldOut: event.target.checked })} />
                    <span>Mark as sold out</span>
                  </label>
                  <label className="check-row">
                    <input type="checkbox" checked={product.featured} onChange={(event) => setProduct({ ...product, featured: event.target.checked })} />
                    <span>Show as featured</span>
                  </label>
                  <button className="button" type="button" onClick={saveProductUpdates}>
                    {editingProduct ? "Save product" : "Add product"}
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="section-head">
                  <div>
                    <h2>Product list</h2>
                    <p className="muted">Choose a product to update details.</p>
                  </div>
                  <button className="button ghost" type="button" onClick={loadProducts}>
                    Refresh
                  </button>
                </div>
                <div className="product-admin-list">
                  {products.map((entry) => (
                    <div className={`product-admin-row ${editingProductId === entry.id ? "active" : ""}`} key={entry.id}>
                      <img alt="" src={entry.imageUrl} />
                      <span>
                        <strong>{entry.name}</strong>
                        <small>
                          ₹{entry.pricePerKg}/kg · {entry.soldOut || entry.stockKg === 0 ? "Sold out" : `${entry.stockKg ?? 20}kg left`}
                        </small>
                      </span>
                      <div className="stock-pill">{entry.stockKg ?? 20}kg remaining</div>
                      <div className="row-actions">
                        <button className="button secondary" type="button" onClick={() => startProductEdit(entry)}>
                          Edit
                        </button>
                        <button className="button danger" type="button" onClick={() => deleteProduct(entry.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="section-head">
                  <div>
                    <h2>{editingOffer ? "Update offer" : "Announce offer"}</h2>
                    <p className="muted">New offers appear in the home banner and once-per-user popup.</p>
                  </div>
                  {editingOffer ? (
                    <button className="button ghost" type="button" onClick={resetOfferForm}>
                      New
                    </button>
                  ) : null}
                </div>
                <div className="form">
                  <div className="field">
                    <label htmlFor="title">Offer title</label>
                    <input id="title" value={offer.title} onChange={(event) => setOffer({ ...offer, title: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" rows={3} value={offer.description} onChange={(event) => setOffer({ ...offer, description: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="expiry">Expiry date</label>
                    <input id="expiry" type="date" value={offer.expiryDate} onChange={(event) => setOffer({ ...offer, expiryDate: event.target.value })} />
                    {offer.expiryDate ? <p className="muted">Shown as {formatDate(offer.expiryDate)}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor="discount">Discount code</label>
                    <input id="discount" value={offer.discountCode} onChange={(event) => setOffer({ ...offer, discountCode: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="extra">Extra item rule</label>
                    <input id="extra" value={offer.extraItemText} onChange={(event) => setOffer({ ...offer, extraItemText: event.target.value })} />
                  </div>
                  <div className="field">
                    <label>Products auto-added when claimed</label>
                    <div className="auto-add-list">
                      {offer.autoAddItems.map((item, index) => (
                        <div className="auto-add-row" key={`${item.productId}-${index}`}>
                          <select value={item.productId} onChange={(event) => updateOfferAutoItem(index, { productId: event.target.value })}>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <input
                            min="0.25"
                            step="0.25"
                            type="number"
                            value={item.quantityKg}
                            onChange={(event) => updateOfferAutoItem(index, { quantityKg: Number(event.target.value) })}
                          />
                          <button className="button danger" type="button" onClick={() => removeOfferAutoItem(index)}>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="button secondary" type="button" onClick={addOfferAutoItem}>
                      + Add product rule
                    </button>
                  </div>
                  <label className="check-row">
                    <input type="checkbox" checked={offer.active} onChange={(event) => setOffer({ ...offer, active: event.target.checked })} />
                    <span>Offer is active</span>
                  </label>
                  <button className="button" type="button" onClick={saveOfferUpdates}>
                    {editingOffer ? "Save offer" : "Create offer"}
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="section-head">
                  <div>
                    <h2>Offer list</h2>
                    <p className="muted">Edit, pause, or delete offers whenever required.</p>
                  </div>
                  <button className="button ghost" type="button" onClick={loadOffers}>
                    Refresh
                  </button>
                </div>
                <div className="offer-admin-list">
                  {offers.map((entry) => (
                    <div className={`offer-admin-row ${editingOfferId === entry.id ? "active" : ""}`} key={entry.id}>
                      <div>
                        <strong>{entry.title}</strong>
                        <p className="muted">{entry.description}</p>
                        <small>
                          {entry.active ? "Active" : "Inactive"} · Expires {formatDate(entry.expiryDate)}
                        </small>
                        {entry.autoAddItems?.length ? (
                          <p className="coupon-line">
                            Auto-add:{" "}
                            {entry.autoAddItems
                              .map((item) => {
                                const product = products.find((entryProduct) => entryProduct.id === item.productId);
                                return `${product?.name ?? item.productId} ${item.quantityKg}kg`;
                              })
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="row-actions">
                        <button className="button secondary" type="button" onClick={() => startOfferEdit(entry)}>
                          Edit
                        </button>
                        <button className="button danger" type="button" onClick={() => deleteOffer(entry.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

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
