import axios from "axios";

// Values a small model often writes when it has nothing real to put in a field
const PLACEHOLDERS = new Set([
  "",
  "n/a",
  "na",
  "null",
  "none",
  "undefined",
  "nil",
  "unknown",
  "not available",
  "not found",
  "not specified",
  "not provided",
  "-",
  "--",
  "—",
]);

const isEmptyValue = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  PLACEHOLDERS.has(String(v).trim().toLowerCase());

export async function parseInvoiceText(text: string) {
  const ollamaUrl = process.env.OLLAMA_URL;
  const modelName = "qwen2.5:3b";

  const prompt = `
You are a strict invoice data extractor. Read the document text and return ONE JSON object.

If the text is NOT an invoice, receipt, or bill, return exactly: { "isInvoice": false }

RULES FOR MISSING DATA (most important):
- Only include a field if its value is literally written in the document.
- If a value is missing, unclear, or not in the document, OMIT that key completely.
- NEVER write "", null, "N/A", "NA", "None", "Not available", "Not found", "Unknown", "-" or 0 as a placeholder.
- NEVER invent or guess a field just to fill the structure.
- "dynamicFields" may contain ONLY label/value pairs that appear in the document (addresses, GSTIN, PO number, due date, etc.). If there are none, return "dynamicFields": {}.
- Do NOT create a field unless you can point to its value in the text.

ITEM RULES:
- Extract EVERY product line item with quantity 1 or more. Ignore items with 0 quantity.
- If an item has no SKU/code in the document, leave out the "sku" key for that item.
- Do not left out any items extract all items in the invoice.

OUTPUT FORMAT (the values below are fake and show the format only. Never copy them):
{
  "isInvoice": true,
  "invoiceNumber": "INV-1001",
  "supplier": "ABC Traders",
  "invoiceDate": "2025-01-31",
  "totalAmount": 1180,
  "dynamicFields": {
    "GSTIN": "29ABCDE1234F1Z5",
    "Payment Terms": "30 days"
  },
  "items": [
    { "productName": "Widget A", "quantity": 2, "unitPrice": 500, "sku": "WA-01" },
    { "productName": "Widget B", "quantity": 1, "unitPrice": 180 }
  ]
}

Return ONLY valid JSON.

Document Text:
${text.substring(0, 150000)}
  `;

  try {
    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: modelName,
      prompt: prompt,
      stream: false,
      format: "json",
      options: {
        num_ctx: 65536, // Doubled context window to handle massive PDF text dumps
        num_predict: 32768, // Massive output limit (required to write out 1000 JSON objects)
        temperature: 0.0, // Set to absolute 0 to prevent creative skipping and enforce strict robotic extraction
      },
    });

    let jsonString = response.data.response;
    jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

    const extractedData = JSON.parse(jsonString);

    // ==========================================================
    // THE FILTER: Remove empty / placeholder fields & 0-qty items
    // ==========================================================
    if (extractedData.isInvoice) {
      // 1. Top-level fields: drop if empty or placeholder
      for (const key of ["invoiceNumber", "supplier"]) {
        if (isEmptyValue(extractedData[key])) {
          delete extractedData[key];
        } else {
          extractedData[key] = String(extractedData[key]).trim();
        }
      }

      if (
        isEmptyValue(extractedData.invoiceDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(extractedData.invoiceDate).trim())
      ) {
        delete extractedData.invoiceDate;
      }

      if (!(Number(extractedData.totalAmount) > 0)) {
        delete extractedData.totalAmount;
      } else {
        extractedData.totalAmount = Number(extractedData.totalAmount);
      }

      // 2. Dynamic fields: keep only real key/value pairs
      const cleanedFields: Record<string, string> = {};
      const rawFields =
        extractedData.dynamicFields &&
          typeof extractedData.dynamicFields === "object"
          ? extractedData.dynamicFields
          : {};
      for (const [key, value] of Object.entries(rawFields)) {
        if (!isEmptyValue(key) && !isEmptyValue(value)) {
          cleanedFields[key.trim()] = String(value).trim();
        }
      }
      extractedData.dynamicFields = cleanedFields;

      // 3. Items: drop nameless / 0-qty rows and empty sku
      extractedData.items = (
        Array.isArray(extractedData.items) ? extractedData.items : []
      )
        .filter(
          (item: any) =>
            !isEmptyValue(item?.productName) && Number(item?.quantity) > 0
        )
        .map((item: any) => {
          const cleaned: any = {
            productName: String(item.productName).trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice) || 0,
          };
          if (!isEmptyValue(item.sku)) cleaned.sku = String(item.sku).trim();
          return cleaned;
        });
    }

    return extractedData;
  } catch (error: any) {
    console.error("Ollama Parsing Error:", error.message);
    throw new Error(
      "Failed to process the document with local AI. Please ensure Ollama is running and has enough RAM to process large documents."
    );
  }
}