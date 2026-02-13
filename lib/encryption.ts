/* ─────────────────────────────────────────────────────────────
   AES-256-GCM Encryption for API Keys
   Production-grade: uses unique IV + auth tag per encryption
   ───────────────────────────────────────────────────────────── */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;           // 128-bit IV
const AUTH_TAG_LENGTH = 16;     // 128-bit auth tag

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Key must be exactly 32 bytes (256 bits) hex-encoded = 64 hex chars
  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

export interface EncryptedPayload {
  encrypted_key: string;   // hex-encoded ciphertext
  iv: string;              // hex-encoded IV
  auth_tag: string;        // hex-encoded auth tag
}

/**
 * Encrypt a plaintext API key using AES-256-GCM.
 * Returns encrypted data with IV and auth tag for safe DB storage.
 */
export function encryptApiKey(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted_key: encrypted,
    iv: iv.toString("hex"),
    auth_tag: authTag.toString("hex"),
  };
}

/**
 * Decrypt an API key from its encrypted payload.
 * Verifies the auth tag to prevent tampering.
 */
export function decryptApiKey(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.auth_tag, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.encrypted_key, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a new random encryption key (for initial setup).
 * Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}
