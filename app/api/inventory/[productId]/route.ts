import { NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const resolvedParams = await params; // Unwrapping the Promise
    
    await prisma.product.delete({
      where: { id: resolvedParams.productId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}