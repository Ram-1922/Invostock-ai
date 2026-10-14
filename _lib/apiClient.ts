import axios from "axios";
import { gcm } from "@noble/ciphers/aes.js";

const SECRET_KEY =
  process.env.NEXT_PUBLIC_PAYLOAD_SECRET || "InvoStockSecureKey12345678901234";

const hexToUint8Array = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

// Web Crypto's `subtle` only exists in secure contexts (HTTPS or localhost).
const hasSubtleCrypto = (): boolean =>
  typeof globalThis !== "undefined" &&
  !!globalThis.crypto &&
  !!globalThis.crypto.subtle;

async function decryptWithSubtle(
  iv: Uint8Array,
  encryptedData: Uint8Array
): Promise<Uint8Array> {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Cast both the algorithm config and the data to 'any' to bypass strict TS DOM types
  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv } as any,
    keyMaterial,
    encryptedData as any
  );

  return new Uint8Array(decryptedBuffer);
}

// Pure-JS fallback for non-secure contexts (e.g. http://192.168.x.x:3000)
function decryptWithNoble(iv: Uint8Array, encryptedData: Uint8Array): Uint8Array {
  const key = new TextEncoder().encode(SECRET_KEY); // must be exactly 32 bytes
  return gcm(key, iv).decrypt(encryptedData);
}

async function decryptPayload(
  ivHex: string,
  payloadHex: string,
  authTagHex: string
) {
  const iv = hexToUint8Array(ivHex);
  const ciphertext = hexToUint8Array(payloadHex);
  const authTag = hexToUint8Array(authTagHex);

  // AES-GCM expects ciphertext followed by the auth tag
  const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
  encryptedData.set(ciphertext, 0);
  encryptedData.set(authTag, ciphertext.length);

  const plaintext = hasSubtleCrypto()
    ? await decryptWithSubtle(iv, encryptedData)
    : decryptWithNoble(iv, encryptedData);

  return JSON.parse(new TextDecoder("utf-8").decode(plaintext));
}

export const apiClient = axios.create();

apiClient.interceptors.response.use(
  async (response) => {
    // Check if the response is our raw secure string
    if (
      typeof response.data === "string" &&
      response.data.startsWith("_secure::")
    ) {
      try {
        const parts = response.data.replace("_secure::", "").split(".");

        if (parts.length === 3) {
          const [iv, authTag, payload] = parts;
          response.data = await decryptPayload(iv, payload, authTag);
        }
      } catch (error) {
        console.error("Payload decryption failed:", error);
        return Promise.reject(error);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 429) {
      // const retryAfterHeader = error.response.headers["retry-after"];
      const retryAfterSeconds =
  Number.parseInt(
    error.response.headers["retry-after"] ?? error.response.data?.retryAfter,
    10
  ) || 60;
        
      // Extract the specific action that was blocked
      const blockedAction = error.response.data?.action || "general_api";

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("rateLimitTriggered", {
            detail: { 
              retryAfterSeconds: Number.isNaN(retryAfterSeconds) ? 60 : retryAfterSeconds,
              action: blockedAction 
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);