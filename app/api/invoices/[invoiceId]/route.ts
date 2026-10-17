import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { encryptPayload } from "@/_lib/encryption";
import { cookies } from "next/headers";
import { verifyToken } from "@/_lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
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

    const resolvedParams = await params; // Unwrapping the Promise (Next.js 15 requirement)
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.invoiceId },
      include: { items: true },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (invoice.userId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const secureString = encryptPayload(invoice);
    
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
    return NextResponse.json({ error: "Failed to fetch invoice details" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
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
    
    const existing = await prisma.invoice.findUnique({
      where: { id: resolvedParams.invoiceId },
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.invoice.delete({
      where: { id: resolvedParams.invoiceId }
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
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}