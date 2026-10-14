import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { encryptPayload } from "@/_lib/encryption";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });

    // Secure the payload
    const secureString = encryptPayload(products);

    return new NextResponse(secureString, {
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}
export async function DELETE() {
  try {
    await prisma.product.deleteMany();
    return NextResponse.json({ success: true, message: "All products cleared" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear inventory" }, { status: 500 });
  }
}