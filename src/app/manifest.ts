import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Druits Dry Fruit Store",
    short_name: "Druits",
    description: "Premium dry fruits, offers, cart, orders, and delivery updates.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#2c160b",
    theme_color: "#8f4319",
    orientation: "portrait",
    icons: [
      {
        src: "/druits-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/druits-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    categories: ["shopping", "food"],
    shortcuts: [
      {
        name: "Cart",
        short_name: "Cart",
        description: "Open your Druits cart.",
        url: "/cart",
        icons: [{ src: "/druits-logo.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Offers",
        short_name: "Offers",
        description: "View active dry fruit offers.",
        url: "/coupons",
        icons: [{ src: "/druits-logo.png", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
