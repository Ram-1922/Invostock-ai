import crypto from "crypto";

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_PAYLOAD_SECRET || "InvoStockSecureKey12345678901234";
const IV_LENGTH = 12; 

export function encryptPayload(data: any) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "utf-8"), iv);
  
  const jsonString = JSON.stringify(data);
  let encrypted = cipher.update(jsonString, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");

  // Combine into a single opaque string rather than a JSON object
  return `_secure::${iv.toString("hex")}.${authTag}.${encrypted}`;
}