import type { Hex } from "@noble/curves/abstract/utils";
import { ed25519 } from "@noble/curves/ed25519";


const privateKey = ed25519.utils.randomPrivateKey();
const publicKey = ed25519.getPublicKey(privateKey);

/**
 * Signs a message with the server's private key.
 *
 * @param message Message to sign
 */
export function sign(message: Hex) {
  return ed25519.sign(message, privateKey);
}

/**
 * Verifies a signature with the server's public key.
 *
 * @param signature Signature to verify
 * @param message Message to verify
 */
export function verify(signature: Hex, message: Hex) {
  return ed25519.verify(signature, message, publicKey);
}
