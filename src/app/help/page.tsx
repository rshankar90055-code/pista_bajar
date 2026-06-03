"use client";

const supportPhone = "+9195388069498";
const displayPhone = "+91 95388069498";

export default function HelpPage() {
  return (
    <main className="profile-page help-page">
      <header className="topbar help-topbar">
        <a className="button ghost" href="/profile">
          Back
        </a>
        <strong>Help</strong>
      </header>

      <section className="help-panel">
        <span className="help-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
          </svg>
        </span>
        <h1>Contact Pista Bajaar</h1>
        <p>For order, payment, delivery, or cancellation help, call us directly.</p>
        <a className="button help-call-button" href={`tel:${supportPhone}`}>
          Call {displayPhone}
        </a>
      </section>
    </main>
  );
}

