import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/_lib/auth";
import { encryptPayload } from "@/_lib/encryption";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, phone: true, city: true, pincode: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const secureString = encryptPayload(user);
    return new NextResponse(secureString, {
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// NEW: Add PUT method to update user profile
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        pincode: data.pincode,
      },
      select: { id: true, name: true, email: true, phone: true, city: true, pincode: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}