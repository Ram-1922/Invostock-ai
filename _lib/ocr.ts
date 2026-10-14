import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Ensure PDF.js worker is not required in Node/Server environment
// Fix: Point directly to the NPM module path so Node.js can dynamically resolve the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      // Handle PDF text extraction
      const data = new Uint8Array(buffer);
      const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      // If PDF has no text (e.g., scanned image inside PDF), we would ideally pass it to Tesseract.
      // For this student project, we return the text found.
      if (!fullText.trim()) {
        throw new Error("No readable text found in this PDF. It might be a scanned image without OCR.");
      }
      return fullText;

    } else if (mimeType.startsWith("image/")) {
      // Handle Image OCR with Tesseract
      const { data: { text } } = await Tesseract.recognize(buffer, "eng");
      return text;
      
    } else {
      throw new Error("Unsupported file type. Please upload a PDF or Image.");
    }
  } catch (error: any) {
    console.error("OCR Processing Error:", error);
    throw new Error(error.message || "Failed to extract text from the document.");
  }
}