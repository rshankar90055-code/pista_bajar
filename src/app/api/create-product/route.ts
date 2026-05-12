import { NextResponse } from "next/server";
import { addProduct } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";

const categories: ProductCategory[] = ["almonds", "cashews", "pistachios", "dates", "raisins", "walnuts", "figs"];

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Product> & { adminPassword?: string };

  if (body.adminPassword !== "admin123") {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!body.name || !body.imageUrl || !body.pricePerKg || !body.category) {
    return NextResponse.json({ error: "Name, image URL, price, and category are required." }, { status: 400 });
  }

  if (!categories.includes(body.category)) {
    return NextResponse.json({ error: "Select a valid dry fruit category." }, { status: 400 });
  }

  const pricePerKg = Number(body.pricePerKg);
  if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
    return NextResponse.json({ error: "Price must be greater than zero." }, { status: 400 });
  }

  const product: Product = {
    id: `${body.category}-${crypto.randomUUID()}`,
    name: body.name,
    imageUrl: body.imageUrl,
    videoUrl: body.videoUrl || "",
    pricePerKg,
    category: body.category,
    description: body.description || "Fresh dry fruit packed for everyday snacking.",
    stockKg: Number(body.stockKg ?? 20),
    soldOut: Boolean(body.soldOut),
    featured: Boolean(body.featured)
  };

  await addProduct(product);
  return NextResponse.json({ product });
}
