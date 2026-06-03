import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pista Bajaar",
    short_name: "Pista Bajaar",
    description: "Luxury Indian dry fruits and organic snacks. Enjoy speed delivery, custom greeting gift boxes, and pure ingredients.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#2d1e18",
    orientation: "portrait",
    icons: [
      {
        src: "/pistabajaar-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/pistabajaar-logo.png",
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
        description: "Open your Pista Bajaar cart.",
        url: "/cart",
        icons: [{ src: "/pistabajaar-logo.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Offers",
        short_name: "Offers",
        description: "View active luxury dry fruit discounts and offers.",
        url: "/coupons",
        icons: [{ src: "/pistabajaar-logo.png", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
