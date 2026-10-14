import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    let marketingPayload: any = {};
    try {
      marketingPayload = await req.json();
    } catch {
      // Body may be empty
    }

    const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    marketingPayload = {
      ip: clientIp,
      ...marketingPayload,
      serverTimestamp: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set("marketing_visitor_data", JSON.stringify(marketingPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Marketing payload stored securely in HttpOnly cookie",
      data: marketingPayload,
    });
  } catch (error) {
    console.error("Failed to store marketing cookie:", error);
    return NextResponse.json({ error: "Failed to set marketing cookie" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get("marketing_visitor_data")?.value;

    if (!cookieValue) {
      return NextResponse.json({ data: null });
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(cookieValue);
    } catch {
      try {
        parsedData = JSON.parse(decodeURIComponent(cookieValue));
      } catch {
        parsedData = cookieValue;
      }
    }

    return NextResponse.json({ data: parsedData });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read marketing cookie" }, { status: 500 });
  }
}
