import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { encryptPayload } from "@/_lib/encryption";

export async function GET() {
  try {
    const totalProducts = await prisma.product.count();
    
    // Example logic for low stock (assuming threshold is 10)
    const lowStockProducts = await prisma.product.count({
      where: { quantity: { lte: 10 } }
    });
    
    const totalInvoices = await prisma.invoice.count();
    
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { invoiceDate: 'desc' }
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
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}