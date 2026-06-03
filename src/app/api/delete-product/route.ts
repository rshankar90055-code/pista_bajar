import { NextResponse } from "next/server";
import { isAdminPasswordValid } from "@/lib/admin";
import { deleteProduct } from "@/lib/store";

export async function POST(request: Request) {
  const { productId, adminPassword } = (await request.json()) as {
    productId?: string;
    adminPassword?: string;
  };

  if (!isAdminPasswordValid(adminPassword)) {
    return NextResponse.json({ error: "Admin password is incorrect." }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }

  const deleted = await deleteProduct(productId);
  if (!deleted) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
