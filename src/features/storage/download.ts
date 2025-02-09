import type { RouterOutput } from "$lib/trpc/client";
import { decrypt } from "$lib/tulip";
import { type FileAttributes, getDecryptedFileAttributes, getDecryptedFileKey } from "~/features/storage/file";


type RemoteFile = RouterOutput["files"]["files"][number];

/**
 * Downloads and decrypts the chunks of a file.
 *
 * @param masterKey
 * @param file
 * @param attributes
 */
export async function* download(
  masterKey: Uint8Array,
  file: RemoteFile,
  attributes?: FileAttributes,
): AsyncGenerator<Uint8Array> {
  const fileKey = getDecryptedFileKey(masterKey, file);

  if (typeof attributes == "undefined") {
    attributes = getDecryptedFileAttributes(masterKey, file);
  }

  for (const chunkId of attributes.chunks) {
    const response = await fetch(`/api/dl/${chunkId}`);
    if (! response.ok) {
      throw new Error("Failed to download chunk");
    }

    const arrayBuffer = await response.arrayBuffer();
    const [decrypted] = decrypt(fileKey, new Uint8Array(arrayBuffer));

    yield decrypted;
  }
}
