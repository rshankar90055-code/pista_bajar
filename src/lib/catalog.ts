import type { Product } from "@/lib/types";

export const defaultProducts: Product[] = [
  {
    id: "almond-premium",
    name: "Premium California Almonds",
    imageUrl: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=900&q=80",
    price250g: 270,
    price500g: 510,
    price1kg: 980,
    pricePerKg: 980,
    category: "almonds",
    description: "Crunchy, hand-sorted whole almonds for royal snacking and healthy gifting.",
    rating: 4.9
  },
  {
    id: "cashew-w240",
    name: "W240 Whole Royal Cashews",
    imageUrl: "https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=900&q=80",
    price250g: 310,
    price500g: 580,
    price1kg: 1120,
    pricePerKg: 1120,
    category: "cashews",
    description: "Creamy, large whole cashews. roasted or raw-ready for rich culinary experiences.",
    rating: 4.8
  },
  {
    id: "pista-salted",
    name: "Lightly Salted Pistachios",
    imageUrl: "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?auto=format&fit=crop&w=900&q=80",
    price250g: 400,
    price500g: 760,
    price1kg: 1460,
    pricePerKg: 1460,
    category: "pistachios",
    description: "Vibrant bright green pistachios with a clean, perfectly balanced salt finish.",
    rating: 4.9
  },
  {
    id: "dates-medjool",
    name: "Soft Arabian Medjool Dates",
    imageUrl: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80",
    price250g: 245,
    price500g: 460,
    price1kg: 890,
    pricePerKg: 890,
    category: "dates",
    description: "Naturally sweet, jumbo soft dates with an exquisite caramel-like bite.",
    rating: 4.7
  },
  {
    id: "raisins-golden",
    name: "Premium Golden Raisins",
    imageUrl: "https://images.unsplash.com/photo-1596591868231-05e8082ed2fc?auto=format&fit=crop&w=900&q=80",
    price250g: 120,
    price500g: 220,
    price1kg: 420,
    pricePerKg: 420,
    category: "raisins",
    description: "Plump, sun-dried golden raisins for gourmet breakfast bowls and baking.",
    rating: 4.6
  },
  {
    id: "walnut-kernels",
    name: "Premium Walnut Kernels",
    imageUrl: "https://images.unsplash.com/photo-1600189083429-1d6f8c7f0f76?auto=format&fit=crop&w=900&q=80",
    price250g: 365,
    price500g: 690,
    price1kg: 1320,
    pricePerKg: 1320,
    category: "walnuts",
    description: "Extra light halves and quarters with a rich, buttery, earthy flavor.",
    rating: 4.8
  },
  {
    id: "figs-anjeer",
    name: "Premium Soft Anjeer Figs",
    imageUrl: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&w=900&q=80",
    price250g: 320,
    price500g: 610,
    price1kg: 1180,
    pricePerKg: 1180,
    category: "figs",
    description: "Naturally sweet, fiber-rich dried figs with a soft and chewy center.",
    rating: 4.9
  },
  {
    id: "saffron-kashmir",
    name: "Royal Kashmiri Saffron (Grade A++)",
    imageUrl: "https://images.unsplash.com/photo-1615485737651-580c9159c89e?auto=format&fit=crop&w=900&q=80",
    price250g: 72000,
    price500g: 142000,
    price1kg: 280000,
    pricePerKg: 280000,
    category: "saffron",
    description: "Pure, long-filament deep red saffron hand-picked from Pampore, Kashmir.",
    rating: 4.9
  },
  {
    id: "seeds-chia",
    name: "Organic Raw Chia Seeds",
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=900&q=80",
    price250g: 195,
    price500g: 360,
    price1kg: 680,
    pricePerKg: 680,
    category: "seeds",
    description: "Nutrient-dense superfood seeds loaded with fiber, omega-3, and protein.",
    rating: 4.7
  },
  {
    id: "snack-trailmix",
    name: "Royal Premium Berries Trail Mix",
    imageUrl: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=900&q=80",
    price250g: 345,
    price500g: 650,
    price1kg: 1250,
    pricePerKg: 1250,
    category: "snacks",
    description: "A gourmet fusion of roasted almonds, cashews, pistachios, and dried cranberries.",
    rating: 4.8
  },
  {
    id: "gift-festive",
    name: "Royal Festive Gold Gift Hamper",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80",
    price250g: 550,
    price500g: 1050,
    price1kg: 1999,
    pricePerKg: 1999,
    category: "gifts",
    description: "An elegant gold-foil luxury gift box packed with dry fruits and a greeting card.",
    rating: 4.9,
    featured: true
  },
  {
    id: "chocolate-dark",
    name: "Artisanal Sugar-Free Almond Chocolate",
    imageUrl: "https://images.unsplash.com/photo-1548907040-4d42b52145ca?auto=format&fit=crop&w=900&q=80",
    price250g: 450,
    price500g: 860,
    price1kg: 1650,
    pricePerKg: 1650,
    category: "chocolates",
    description: "Handcrafted dark chocolate infused with premium active roasted almond chunks.",
    rating: 4.8
  }
];
