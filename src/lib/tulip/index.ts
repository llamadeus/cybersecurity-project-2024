import { concat } from "$lib/tulip/utils/buffer";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/ciphers/webcrypto";


// Key length for XChaCha20-Poly1305
const KEY_LENGTH = 32;

// Nonce length for XChaCha20-Poly1305
const NONCE_LENGTH = 24;

/**
 * Generates a random key for XChaCha20-Poly1305.
 */
export function randomKey(): Uint8Array {
  return randomBytes(KEY_LENGTH);
}

/**
 * Generates a nonce.
 */
export function randomNonce(): Uint8Array {
  return randomBytes(NONCE_LENGTH);
}

/**
 * Encrypts the given data using XChaCha20-Poly1305.
 *
 * @param key Encryption key
 * @param data Plaintext data to encrypt
 * @param nonce Nonce for the encryption. If not provided, a random nonce will be generated.
 */
export function encrypt(
  key: Uint8Array,
  data: Uint8Array,
  nonce: Uint8Array = randomNonce(),
): Uint8Array {
  const encrypted = xchacha20poly1305(key, nonce).encrypt(data);

  return concat(nonce, encrypted);
}

/**
 * Decrypts the given XChaCha20-Poly1305 encrypted data.
 *
 * @param key Encryption key
 * @param data Data to decrypt
 */
export function decrypt(
  key: Uint8Array,
  data: Uint8Array,
): [decrypted: Uint8Array, nonce: Uint8Array] {
  const [nonce, encrypted] = splitNonce(data);

  return [
    xchacha20poly1305(key, nonce).decrypt(encrypted),
    nonce,
  ];
}

/**
 * Splits a nonce and a buffer into two separate arrays.
 *
 * @param buffer Buffer to split
 */
export function splitNonce(buffer: Uint8Array): [nonce: Uint8Array, buffer: Uint8Array] {
  if (buffer.length < NONCE_LENGTH) {
    throw new Error("Invalid buffer length");
  }

  return [
    buffer.subarray(0, NONCE_LENGTH),
    buffer.subarray(NONCE_LENGTH),
  ];
}

/**
 * Returns the Poly1305 authentication tag from an encrypted chunk.
 *
 * @param encryptedChunk
 */
export function getAuthTag(encryptedChunk: Uint8Array): Uint8Array {
  return encryptedChunk.subarray(-16);
}
