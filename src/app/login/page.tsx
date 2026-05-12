"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (localStorage.getItem("druits_phone")) {
      window.location.href = "/";
    }
  }, []);

  async function sendOtp() {
    const response = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error);
      return;
    }
    setOtpSent(true);
    setToast(`OTP sent. Local dev OTP is ${data.devOtp}.`);
  }

  async function verifyOtp() {
    const response = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error);
      return;
    }
    localStorage.setItem("druits_phone", data.user.phone);
    window.location.href = "/";
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark">D</span>
          <span>Druits</span>
        </div>
        <h1>Login to continue</h1>
        <p className="muted">Enter your phone number and verify OTP to start shopping.</p>
        <div className="form">
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" inputMode="tel" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          {otpSent ? (
            <div className="field">
              <label htmlFor="otp">OTP</label>
              <input id="otp" inputMode="numeric" placeholder="123456" value={otp} onChange={(event) => setOtp(event.target.value)} />
            </div>
          ) : null}
          <button className="button" type="button" onClick={otpSent ? verifyOtp : sendOtp}>
            {otpSent ? "Verify OTP" : "Send OTP"}
          </button>
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
