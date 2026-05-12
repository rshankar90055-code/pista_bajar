import { NextResponse } from "next/server";
import { updateProduct } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";

const categories: ProductCategory[] = ["almonds", "cashews", "pistachios", "dates", "raisins", "walnuts", "figs"];

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Product> & { adminPassword?: string; productId?: string };

  if (body.adminPassword !== "admin123") {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!body.productId) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }

  if (body.category && !categories.includes(body.category)) {
    return NextResponse.json({ error: "Select a valid dry fruit category." }, { status: 400 });
  }

  const updates: Partial<Product> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl;
  if (typeof body.videoUrl === "string") updates.videoUrl = body.videoUrl;
  if (typeof body.description === "string") updates.description = body.description;
  if (body.category) updates.category = body.category;
  if (body.pricePerKg !== undefined) updates.pricePerKg = Number(body.pricePerKg);
  if (body.stockKg !== undefined) updates.stockKg = Math.max(0, Number(body.stockKg));
  if (body.soldOut !== undefined) updates.soldOut = Boolean(body.soldOut);
  if (body.featured !== undefined) updates.featured = Boolean(body.featured);

  if (updates.pricePerKg !== undefined && (!Number.isFinite(updates.pricePerKg) || updates.pricePerKg <= 0)) {
    return NextResponse.json({ error: "Price must be greater than zero." }, { status: 400 });
  }

  if (updates.stockKg !== undefined && !Number.isFinite(updates.stockKg)) {
    return NextResponse.json({ error: "Stock must be a valid number." }, { status: 400 });
  }

  const product = await updateProduct(body.productId, updates);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
