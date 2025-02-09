import { fastCDC2 } from "$lib/fastcdc";
import { trpc } from "$lib/trpc/client";
import { encrypt, getAuthTag, randomKey, randomNonce } from "$lib/tulip";
import { obfuscateFileKey, updateCondensedMac } from "$lib/tulip/files";
import { encodeBase64Url } from "$lib/utils/base64url";
import { utf8ToBytes } from "@noble/ciphers/utils";
import type { FileAttributes } from "~/features/storage/file";


interface VaultInfo {
  ticket: Uint8Array;
  x25519PublicKey: Uint8Array
}

/**
 * Chunks the given file using FastCDC, encrypts them, and stores the chunks on the server.
 *
 * @param masterKey
 * @param file
 * @param vaultInfo
 */
export async function upload(masterKey: Uint8Array, file: File, vaultInfo?: VaultInfo) {
  const chunks = fastCDC2(file.stream().getReader(), {
    minSize: 1024,
    maxSize: 8 * 1024 * 1024,
    averageSize: 4 * 1024 * 1024,
  });

  const fileKey = randomKey();
  const baseNonce = randomNonce();
  const chunkIds: string[] = [];

  let condensedMac = new Uint8Array(16);

  for await (const chunk of chunks) {
    const encryptedChunk = encrypt(fileKey, chunk.data);
    const formData = new FormData();
    formData.append("blob", new Blob([encryptedChunk]));

    if (typeof vaultInfo != "undefined") {
      formData.append("ticket", new Blob([vaultInfo.ticket]));
    }

    // Upload the chunk to the server
    const response = await fetch("/api/ul", {
      method: "POST",
      headers: {
        "x-application": "sveltekit",
      },
      body: formData,
    });
    if (! response.ok) {
      const { message } = await response.json();

      throw new Error(message);
    }

    const { id: chunkId } = await response.json();

    condensedMac = updateCondensedMac(condensedMac, getAuthTag(encryptedChunk));
    chunkIds.push(chunkId);
  }

  // Obfuscate the file key using the base nonce and the condensed MAC
  const obfuscatedFileKey = obfuscateFileKey(fileKey, baseNonce, condensedMac);
  // Encrypt the file key using the master key
  const encryptedFileKey = encrypt(masterKey, obfuscatedFileKey, baseNonce);

  // Finalize the upload and store the file key and the base nonce
  const fileType = file.type.length > 0 ? file.type : "application/octet-stream";
  const attributes = JSON.stringify({
    name: file.name,
    type: fileType,
    size: file.size,
    chunks: chunkIds,
  } satisfies FileAttributes);
  const encryptedAttributes = encrypt(fileKey, utf8ToBytes(attributes));

  if (typeof vaultInfo == "undefined") {
    await trpc().upload.mutate({
      key: encodeBase64Url(encryptedFileKey),
      cmac: encodeBase64Url(condensedMac),
      attributes: encodeBase64Url(encryptedAttributes),
    });
  }
  else {
    await trpc().uploadWithTicket.mutate({
      ticket: encodeBase64Url(vaultInfo.ticket),
      x25519PublicKey: encodeBase64Url(vaultInfo.x25519PublicKey),
      key: encodeBase64Url(encryptedFileKey),
      cmac: encodeBase64Url(condensedMac),
      attributes: encodeBase64Url(encryptedAttributes),
    });
  }
}
