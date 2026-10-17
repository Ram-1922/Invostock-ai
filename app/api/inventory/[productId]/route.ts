import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/_lib/auth";

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const resolvedParams = await params; // Unwrapping the Promise
    
    await prisma.product.delete({
      where: { id: resolvedParams.productId }
    });
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}