/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { openDB } from "$lib/keyval";
import { type RouterOutput, trpc as makeTrpcClient, type TrpcClient } from "$lib/trpc/client";
import { x25519 } from "@noble/curves/ed25519";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { download } from "~/features/storage/download";
import { getDecryptedFileAttributes } from "~/features/storage/file";
import { encodeFilename } from "~/service-worker/utils";
import { decrypt } from "../lib/tulip";
import { decodeBase64Url } from "../lib/utils/base64url";


type RemoteFile = RouterOutput["files"]["files"][number];

// https://kit.svelte.dev/docs/service-workers#type-safety
const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("install", (event) => {
  event.waitUntil(sw.skipWaiting());
});

sw.addEventListener("activate", async (event) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/sw/")) {
    event.respondWith(handleSWRequest(event));
  }
});

async function handleSWRequest(event: FetchEvent) {
  const url = new URL(event.request.url);
  const trpc = makeTrpcClient({ fetch, url: { origin: url.origin } });
  const key = await getKey();

  if (key === null) {
    return new Response("not authenticated", { status: 401 });
  }

  if (url.pathname.startsWith("/sw/v/")) {
    return handleVaultFileRequest(trpc, url, key);
  }

  const [, id] = url.pathname.slice(1).split("/");
  if (typeof id == "undefined") {
    return new Response("invalid token", { status: 400 });
  }

  const file = await trpc.file.query({ id });
  if (typeof file == "undefined") {
    return new Response("not found", { status: 404 });
  }

  return respondWithFile(file, key, url.searchParams.get("dl") ? "download" : "view");
}

async function handleVaultFileRequest(trpc: TrpcClient, url: URL, key: Uint8Array) {
  const [, , slotId] = url.pathname.slice(1).split("/");
  if (typeof slotId == "undefined") {
    return new Response("invalid token", { status: 400 });
  }

  const slot = await trpc.slot.query({ id: slotId });
  if (typeof slot == "undefined") {
    return new Response("slot not found", { status: 404 });
  }

  if (slot.fileId === null || slot.fileX25519PublicKey === null) {
    return new Response("slot does not contain a file", { status: 400 });
  }

  const { x25519PrivateKey = null } = await trpc.auth.query() ?? {};
  if (x25519PrivateKey === null) {
    return new Response("missing x25519PrivateKey", { status: 400 });
  }

  const file = await trpc.file.query({ id: slot.fileId });
  if (typeof file == "undefined") {
    return new Response("file not found", { status: 404 });
  }

  const [decryptedX25519PrivateKey] = decrypt(key, decodeBase64Url(x25519PrivateKey));
  const sharedSecret = x25519.getSharedSecret(decryptedX25519PrivateKey, decodeBase64Url(slot.fileX25519PublicKey));
  const fileMasterKey = hkdf(sha256, sharedSecret, undefined, undefined, 32);

  return respondWithFile(file, fileMasterKey, url.searchParams.get("dl") ? "download" : "view");
}

function respondWithFile(file: RemoteFile, key: Uint8Array, mode: "view" | "download") {
  const attributes = getDecryptedFileAttributes(key, file);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of download(key, file, attributes)) {
          controller.enqueue(chunk);
        }

        controller.close();
      }
      catch (error) {
        return controller.error(error);
      }
    },
    cancel() {
      console.log("Stream canceled");
    },
  });

  const headers: HeadersInit = {
    "Content-Type": attributes.type.length > 0 ? attributes.type : "application/octet-stream",
    "Content-Length": attributes.size.toString(),
  };

  if (mode === "download") {
    headers["Content-Disposition"] = `attachment; filename*=utf-8''${encodeFilename(attributes.name)}`;
  }

  return new Response(stream, { headers });
}

async function getKey(): Promise<Uint8Array | null> {
  const keyval = await openDB();

  return keyval?.get<Uint8Array>("masterKey");
}
