import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/app/pwa-register";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FAF7F2"
};

export const metadata: Metadata = {
  title: "Pista Bajaar | Luxury Indian Dry Fruits & Organic Wellness",
  description: "Savor premium hand-sorted almonds, cashews, Kashmir saffron, rich organic nuts, and healthy trail mixes. Delivered fast in luxurious packaging.",
  manifest: "/manifest.webmanifest",
  applicationName: "Pista Bajaar",
  metadataBase: new URL("https://pistabajaar.vercel.app"),
  openGraph: {
    title: "Pista Bajaar | Luxury Indian Dry Fruits & Organic Wellness",
    description: "Savor premium hand-sorted almonds, cashews, Kashmir saffron, rich organic nuts, and healthy trail mixes. Delivered fast in luxurious packaging.",
    siteName: "Pista Bajaar",
    type: "website",
    images: ["/pistabajaar-logo.png"]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pista Bajaar"
  },
  icons: {
    icon: "/pistabajaar-logo.png",
    apple: "/pistabajaar-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <div className="simulator-page-wrapper">
          <div className="desktop-simulator-frame">
            <div className="desktop-dynamic-island" />
            <div className="desktop-simulator-screen">
              {children}
            </div>
            <div className="desktop-home-indicator" />
          </div>
        </div>
        <PwaRegister />
      </body>
    </html>
  );
}
