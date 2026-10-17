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

    const invoices = await prisma.invoice.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
    });
    const secureString = encryptPayload(invoices);

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
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate the request
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userExists = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!userExists) {
      cookieStore.delete("auth_token");
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    // 2. Process the invoice data
    const data = await req.json();

    // --- NEW FIX: Auto-resolve duplicate invoice numbers ---
    let finalInvoiceNumber = data.invoiceNumber || `INV-${Date.now()}`;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: finalInvoiceNumber }
    });

    if (existingInvoice) {
      // If it exists, append a random 4-digit number to make it unique
      finalInvoiceNumber = `${finalInvoiceNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // -------------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      // 3. Create Invoice using the guaranteed unique finalInvoiceNumber
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: finalInvoiceNumber,
          supplier: data.supplier,
          invoiceDate: new Date(data.invoiceDate),
          totalAmount: data.totalAmount,
          userId: payload.userId,
          status: "CONFIRMED",
          dynamicFields: data.dynamicFields || {},
          items: {
            create: data.items.map((item: any) => ({
              productName: item.productName,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              lineTotal: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        },
      });

      // 4. Update Inventory Quantities
      for (const item of data.items) {
        await tx.product.upsert({
          where: { sku: item.sku || `SKU-${item.productName.substring(0, 3)}` },
          update: { quantity: { increment: Number(item.quantity) } },
          create: {
            name: item.productName,
            sku: item.sku || `SKU-${item.productName.substring(0, 3)}-${Date.now()}`,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          },
        });
      }
      return invoice;
    });

    return NextResponse.json(
      { success: true, invoice: result },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    );
  } catch (error: any) {
    console.error("Database transaction error:", error);

    // Fallback error handler just in case
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "An invoice with this number already exists. Please change it and try again." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to process invoice" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Delete user's invoices (Invoice items will be auto-deleted due to Cascade in Prisma)
    await prisma.invoice.deleteMany({
      where: { userId: payload.userId }
    });
    return NextResponse.json(
      { success: true, message: "All invoices cleared" },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear invoices" }, { status: 500 });
  }
}