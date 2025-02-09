import type { RouterOutput } from "$lib/trpc/client";
import { decrypt } from "$lib/tulip";
import { unobfuscateFileKey } from "$lib/tulip/files";
import { decodeBase64Url } from "$lib/utils/base64url";
import { bytesToUtf8 } from "@noble/ciphers/utils";
import { z } from "zod";


type RemoteFile = RouterOutput["files"]["files"][number];

const fileAttributesSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  chunks: z.array(z.string()),
});

export type FileAttributes = z.infer<typeof fileAttributesSchema>;
export type ChunkEntry = FileAttributes["chunks"][number];

/**
 * Returns the decrypted file key for a file.
 *
 * @param masterKey
 * @param file
 */
export function getDecryptedFileKey(masterKey: Uint8Array, file: Pick<RemoteFile, "key" | "cmac">): Uint8Array {
  const encryptedFileKey = decodeBase64Url(file.key);
  const [obfuscatedFileKey, nonce] = decrypt(masterKey, encryptedFileKey);

  return unobfuscateFileKey(obfuscatedFileKey, nonce, decodeBase64Url(file.cmac));
}

/**
 * Returns the decrypted file attributes for a file.
 *
 * @param masterKey
 * @param file
 */
export function getDecryptedFileAttributes(
  masterKey: Uint8Array,
  file: Pick<RemoteFile, "key" | "cmac" | "attributes">,
): FileAttributes {
  const fileKey = getDecryptedFileKey(masterKey, file);
  const rawAttributes = decodeBase64Url(file.attributes);
  const [decryptedAttributes] = decrypt(fileKey, rawAttributes);

  return JSON.parse(bytesToUtf8(decryptedAttributes));
}
