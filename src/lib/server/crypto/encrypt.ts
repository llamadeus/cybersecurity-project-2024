import { decrypt as tulipDecrypt, encrypt as tulipEncrypt } from "$lib/tulip";
import { randomBytes } from "@noble/ciphers/webcrypto";


const encryptionKey = randomBytes(32);

export function encrypt(data: Uint8Array): Uint8Array {
  return tulipEncrypt(encryptionKey, data);
}

export function decrypt(data: Uint8Array): Uint8Array {
  return tulipDecrypt(encryptionKey, data)[0];
}
