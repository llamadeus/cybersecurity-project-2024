import { sha256 } from "@noble/hashes/sha2";


/**
 * Updates a condensed MAC with the given MAC and authentication tag.
 *
 * @param mac
 * @param authenticationTag
 */
export function updateCondensedMac(mac: Uint8Array, authenticationTag: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(mac);

  // XOR the auth tag into the condensed MAC
  for (let i = 0; i < copy.length; i++) {
    copy[i]! ^= authenticationTag[i % authenticationTag.length]!;
  }

  return sha256(copy).slice(0, 16);
}

/**
 * Obfuscates the given file key using the given nonce and the given condensed MAC.
 *
 * Based on the following pseudocode:
 * Obfuscated File Key = [
 *     File Key[0] ⊕ Nonce[0],
 *     File Key[1] ⊕ Nonce[1],
 *     File Key[2] ⊕ Nonce[2],
 *     File Key[3] ⊕ Nonce[3],
 *     File Key[4] ⊕ Nonce[4],
 *     File Key[5] ⊕ Nonce[5],
 *     File Key[6] ⊕ Nonce[6],
 *     File Key[7] ⊕ Nonce[7],
 *     File Key[8] ⊕ Nonce[8],
 *     File Key[9] ⊕ Nonce[9],
 *     File Key[10] ⊕ Nonce[10],
 *     File Key[11] ⊕ Nonce[11],
 *     File Key[12] ⊕ Condensed MAC[0] ⊕ Condensed MAC[1],
 *     File Key[13] ⊕ Condensed MAC[2] ⊕ Condensed MAC[3],
 *     File Key[14] ⊕ Condensed MAC[4] ⊕ Condensed MAC[5],
 *     File Key[15] ⊕ Condensed MAC[6] ⊕ Condensed MAC[7],
 *     Nonce[0],
 *     Nonce[1],
 *     Nonce[2],
 *     Nonce[3],
 *     Nonce[4],
 *     Nonce[5],
 *     Nonce[6],
 *     Nonce[7],
 *     Nonce[8],
 *     Nonce[9],
 *     Nonce[10],
 *     Nonce[11],
 *     Condensed MAC[0] ⊕ Condensed MAC[1],
 *     Condensed MAC[2] ⊕ Condensed MAC[3],
 *     Condensed MAC[4] ⊕ Condensed MAC[5],
 *     Condensed MAC[6] ⊕ Condensed MAC[7],
 * ]
 *
 * @param fileKey
 * @param nonce
 * @param condensedMac
 */
export function obfuscateFileKey(fileKey: Uint8Array, nonce: Uint8Array, condensedMac: Uint8Array): Uint8Array {
  const obfuscated = new Uint8Array(64);

  // First 24 bytes of the file key are XORed with the nonce
  for (let i = 0; i < 24; i++) {
    obfuscated[i] = fileKey[i]! ^ nonce[i]!;
  }

  // Next 8 bytes of the file key are XORed with the first 8 bytes of the condensed MAC
  for (let i = 24; i < 32; i++) {
    const cmacIndex1 = (i - 24) * 2;
    const cmacIndex2 = cmacIndex1 + 1;

    obfuscated[i] = fileKey[i]! ^ condensedMac[cmacIndex1]! ^ condensedMac[cmacIndex2]!;
  }


  // Next 24 bytes of the obfuscated file key are just the nonce
  for (let i = 32; i < 56; i++) {
    obfuscated[i] = nonce[i - 32]!;
  }

  // Last 8 bytes of the obfuscated file key the XORed using the condensed MAC
  for (let i = 56; i < 64; i++) {
    const cmacIndex1 = (i - 24) * 2;
    const cmacIndex2 = cmacIndex1 + 1;

    obfuscated[i] = condensedMac[cmacIndex1]! ^ condensedMac[cmacIndex2]!;
  }

  return obfuscated;
}

/**
 * Reverts the file key obfuscation and returns the original file key.
 *
 * @param obfuscatedFileKey Obfuscated file key
 * @param nonce Nonce used for the encryption
 * @param condensedMac Condensed MAC
 */
export function unobfuscateFileKey(
  obfuscatedFileKey: Uint8Array,
  nonce: Uint8Array,
  condensedMac: Uint8Array,
): Uint8Array {
  return obfuscateFileKey(obfuscatedFileKey, nonce, condensedMac).slice(0, 32);
}
