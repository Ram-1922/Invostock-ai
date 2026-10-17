import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { encryptPayload } from "@/_lib/encryption";
import { cookies } from "next/headers";
import { verifyToken } from "@/_lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { name: "asc" }
    });

    // Secure the payload
    const secureString = encryptPayload(products);

    return new NextResponse(secureString, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.product.deleteMany();
    return NextResponse.json(
      { success: true, message: "All products cleared" },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear inventory" }, { status: 500 });
  }
}