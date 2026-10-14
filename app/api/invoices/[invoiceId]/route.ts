import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { encryptPayload } from "@/_lib/encryption";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const resolvedParams = await params; // Unwrapping the Promise (Next.js 15 requirement)
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.invoiceId },
      include: { items: true },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const secureString = encryptPayload(invoice);
    
    return new NextResponse(secureString, {
      headers: { "Content-Type": "text/plain" }
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
    const resolvedParams = await params; // Unwrapping the Promise
    
    await prisma.invoice.delete({
      where: { id: resolvedParams.invoiceId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}