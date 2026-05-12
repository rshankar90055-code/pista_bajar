import type { Metadata } from "next";
import { PwaRegister } from "@/app/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Druits Dry Fruit Store",
  description: "A simple dry-fruits-only commerce app with OTP login, offers, cart, orders, and admin dashboard.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Druits"
  },
  icons: {
    icon: "/druits-logo.png",
    apple: "/druits-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
