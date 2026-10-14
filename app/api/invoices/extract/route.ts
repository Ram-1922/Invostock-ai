import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/_lib/ocr";
import { parseInvoiceText } from "@/_lib/llm";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract Text via OCR or PDF parsing
    const extractedText = await extractTextFromFile(buffer, file.type);

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ error: "Could not detect enough text in the document." }, { status: 400 });
    }

    // 3. Send text to LLM for structuring
    const structuredData = await parseInvoiceText(extractedText);

    // 4. Handle irrelevant documents dynamically
    if (structuredData.isInvoice === false) {
      return NextResponse.json({ 
        error: "This document does not appear to be a valid invoice, bill, or receipt. Please upload a relevant file." 
      }, { status: 400 });
    }

    // Return the successful structured data
    return NextResponse.json(structuredData);

  } catch (error: any) {
    console.error("Extraction API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process the invoice." }, { status: 500 });
  }
}