"use client";

import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [toast, setToast] = useState("");
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pistabajar_phone")) {
      window.location.href = "/";
    }
  }, []);

  function handleLogin() {
    if (!phone) {
      setToast("Please enter your Phone or Email ✉️");
      return;
    }
    if (!password) {
      setToast("Please enter your Password 🔑");
      return;
    }
    
    localStorage.setItem("pistabajar_phone", phone);
    const mockName = name || (phone.includes("@") ? phone.split("@")[0] : "Customer");
    localStorage.setItem("pistabajar_name", mockName);
    window.location.href = "/";
  }

  function handleSignUp() {
    if (!name.trim()) {
      setToast("Please enter your Full Name 👤");
      return;
    }
    if (!phone) {
      setToast("Please enter your Phone or Email ✉️");
      return;
    }
    if (!password) {
      setToast("Please enter your Password 🔑");
      return;
    }
    
    localStorage.setItem("pistabajar_phone", phone);
    localStorage.setItem("pistabajar_name", name);
    window.location.href = "/";
  }

  function handleGoogleLogin() {
    localStorage.setItem("pistabajar_phone", "google-user");
    localStorage.setItem("pistabajar_name", "Google User");
    window.location.href = "/";
  }

  return (
    <main className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090706', padding: '16px' }}>
      <SplashScreen force onComplete={() => setIsSplashDone(true)} />
      {isSplashDone ? (
        <section className="login-card" style={{ 
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(28, 21, 19, 0.95)', 
          border: '1px solid rgba(223, 177, 91, 0.25)', 
          color: 'white', 
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          <div className="brand login-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
            <img src="/pistabajar-logo.png" alt="Pista Bajar" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
            <span style={{ fontSize: '1.8rem', fontWeight: '950', letterSpacing: '0.04em', color: 'transparent', backgroundImage: 'linear-gradient(to right, #ffffff, #dfb15b)', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>Pista Bajar</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', color: '#faf7f2', margin: '0 0 6px' }}>
            {isSignUp ? "Create Account" : "Login"}
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#a5948b', textAlign: 'center', marginBottom: '24px', fontWeight: '500' }}>
            {isSignUp ? "Sign up to savor luxury organic dry fruits." : "Welcome back to Pista Bajar."}
          </p>

          <div className="form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isSignUp && (
              <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="name" style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#dfb15b', letterSpacing: '0.08em' }}>Full Name</label>
                <input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', outline: 'none' }} />
              </div>
            )}

            <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="phone" style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#dfb15b', letterSpacing: '0.08em' }}>Phone or Email</label>
              <input id="phone" placeholder="Enter email or phone number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', outline: 'none' }} />
            </div>

            <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#dfb15b', letterSpacing: '0.08em' }}>Password</label>
              <input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', outline: 'none' }} />
            </div>

            <button 
              className="button" 
              type="button" 
              onClick={isSignUp ? handleSignUp : handleLogin} 
              style={{ background: 'linear-gradient(135deg, #dfb15b, #b88d3d)', border: 0, color: '#1c130f', padding: '14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'extrabold', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '8px', cursor: 'pointer', transition: 'opacity 0.2s' }}
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </button>

            {/* Google Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ padding: '0 12px', fontSize: '0.65rem', color: '#a5948b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Google Login button */}
            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              style={{ background: '#ffffff', color: '#000000', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: '#dfb15b', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
            </button>
            <p style={{ fontSize: '0.62rem', color: 'rgba(165, 148, 139, 0.6)', lineHeight: '1.4', margin: 0 }}>
              Premium dry fruits delivered in 15-20 minutes.
            </p>
          </div>
        </section>
      ) : null}
      {toast ? (
        <div className="toast" role="status" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#2d1e18', border: '1px solid #dfb15b', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10000 }}>
          <span>{toast}</span>
          <button className="button ghost" type="button" onClick={() => setToast("")} style={{ background: '#faf7f2', color: '#2d1e18', border: 0, padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      ) : null}
    </main>
  );
}
