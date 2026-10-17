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

    const totalProducts = await prisma.product.count();
    
    // Low stock products count
    const lowStockProducts = await prisma.product.count({
      where: { quantity: { lte: 10 } }
    });
    
    // User-scoped invoices
    const totalInvoices = await prisma.invoice.count({
      where: { userId: payload.userId }
    });
    
    const recentInvoices = await prisma.invoice.findMany({
      where: { userId: payload.userId },
      take: 5,
      orderBy: { invoiceDate: "desc" }
    });

    const data = {
      totalProducts,
      lowStockProducts,
      totalInvoices,
      recentInvoices
    };

    // Secure the payload
    const secureString = encryptPayload(data);
    
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
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}