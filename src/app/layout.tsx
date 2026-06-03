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
  title: "Pista Bajar | Luxury Indian Dry Fruits & Organic Wellness",
  description: "Savor premium hand-sorted almonds, cashews, Kashmir saffron, rich organic nuts, and healthy trail mixes. Delivered fast in luxurious packaging.",
  manifest: "/manifest.webmanifest",
  applicationName: "Pista Bajar",
  metadataBase: new URL("https://pistabajar.vercel.app"),
  openGraph: {
    title: "Pista Bajar | Luxury Indian Dry Fruits & Organic Wellness",
    description: "Savor premium hand-sorted almonds, cashews, Kashmir saffron, rich organic nuts, and healthy trail mixes. Delivered fast in luxurious packaging.",
    siteName: "Pista Bajar",
    type: "website",
    images: ["/pistabajar-logo.png"]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pista Bajar"
  },
  icons: {
    icon: "/pistabajar-logo.png",
    apple: "/pistabajar-logo.png"
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
        <div className="min-h-screen bg-[#FAF7F2]">
          {children}
        </div>
        <PwaRegister />
      </body>
    </html>
  );
}
