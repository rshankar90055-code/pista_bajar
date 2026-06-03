"use client";

import { useEffect, useState } from "react";
import type { AppNotification } from "@/lib/types";

const sampleAlert: AppNotification = {
  id: "sample-alert",
  audience: "user",
  title: "Welcome to Pista Bajar",
  message: "Fresh dry fruits, premium offers, delivery OTP updates, and order alerts will appear here.",
  type: "deal",
  createdAt: "2026-05-11T00:00:00.000Z",
  read: false
};

function formatAlertDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(dateValue));
}

export default function AlertsPage() {
  const [phone, setPhone] = useState("");
  const [alerts, setAlerts] = useState<AppNotification[]>([sampleAlert]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedPhone = localStorage.getItem("pistabajar_phone") ?? "";
    setPhone(savedPhone);

    if (!savedPhone) return;
    void fetch(`/api/notifications?audience=user&phone=${encodeURIComponent(savedPhone)}`)
      .then((response) => response.json())
      .then((data) => {
        const notifications = (data.notifications ?? []) as AppNotification[];
        setAlerts(notifications.length ? notifications : [sampleAlert]);
      });
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" style={{ background: 'linear-gradient(135deg, #dfb15b, #b88d3d)', borderRadius: '8px', color: '#1c130f', fontWeight: 'bold', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
            <img src="/pistabajar-logo.png" alt="P" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </span>
          <span>Pista Bajar Alerts</span>
        </a>
        <a className="button ghost" href="/">
          Home
        </a>
      </header>

      <section className="panel">
        <div className="section-head">
          <div>
            <h1>Messages</h1>
            <p className="muted">{phone ? `Updates for ${phone}` : "Login to receive order and offer alerts."}</p>
          </div>
        </div>

        <div className="alerts-list">
          {alerts.map((alert) => (
            <article className="alert-card" key={alert.id}>
              <span className="alert-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
              </span>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                <small>{mounted ? formatAlertDate(alert.createdAt) : ""}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
