import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  // Later, replace this mock with Shiprocket credentials and endpoint:
  // await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${process.env.SHIPROCKET_TOKEN}`
  //   },
  //   body: JSON.stringify(body)
  // });

  return NextResponse.json({
    message: "Mock Shiprocket pickup created.",
    payload: body
  });
}
