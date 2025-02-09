<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { CardDescription } from "$lib/components/ui/card/index.js";
  import { trpc } from "$lib/trpc/client";
  import { decrypt } from "$lib/tulip";
  import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url.js";
  import { errorMessage } from "$lib/utils/errors";
  import { bytesToUtf8 } from "@noble/ciphers/utils";
  import { ed25519, x25519 } from "@noble/curves/ed25519";
  import { hkdf } from "@noble/hashes/hkdf";
  import { sha256 } from "@noble/hashes/sha2";
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { upload } from "~/features/storage/upload";
  import UploadEntry from "~/routes/v/[token]/UploadEntry.svelte";
  import type { RouteParams } from "./$types";


  const params = $page.params as RouteParams;
  const vaultKey = browser ? decodeBase64Url(location.hash.slice(1)) : null;

  interface Vault {
    x25519PublicKey: string;
    name: string;
    createdAt: string;
    slots: Slot[];
  }

  interface Slot {
    name: string;
    maxSize: number;
    available: boolean;
    ticket: Uint8Array;
  }

  let vault: Vault | null = $state(null);

  async function loadRemoteVault() {
    if (vaultKey === null) {
      throw new Error("Missing vault key");
    }

    try {
      const request = await trpc($page).requestVault.query({
        token: params.token,
      });

      const [decryptedAuthKey] = decrypt(vaultKey, decodeBase64Url(request.authkey));
      const challenge = decodeBase64Url(request.challenge);
      const proof = ed25519.sign(challenge, decryptedAuthKey);

      const access = await trpc($page).accessVault.query({
        token: params.token,
        challenge: request.challenge,
        proof: encodeBase64Url(proof),
      });

      const [decryptedAttributes] = decrypt(vaultKey, decodeBase64Url(access.attributes));
      const attributes = JSON.parse(bytesToUtf8(decryptedAttributes));

      vault = {
        x25519PublicKey: access.x25519PublicKey,
        name: attributes.name,
        createdAt: access.createdAt,
        slots: access.slots.map((slot) => {
          const [decryptedAttributes] = decrypt(vaultKey, decodeBase64Url(slot.attributes));
          const attributes = JSON.parse(bytesToUtf8(decryptedAttributes));

          return ({
            name: attributes.name,
            maxSize: slot.maxSize,
            available: slot.available,
            ticket: decodeBase64Url(slot.ticket),
          });
        }),
      };
    }
    catch (error) {
      toast.error(errorMessage(error));
    }
  }

  onMount(loadRemoteVault);

  async function handleFile(slot: Slot, file: File) {
    const vaultX25519PublicKey = vault?.x25519PublicKey;
    if (typeof vaultX25519PublicKey == "undefined") {
      throw new Error("Missing vault key");
    }

    const promise = new Promise<void>(async (resolve, reject) => {
      const x25519PrivateKey = x25519.utils.randomPrivateKey();
      const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);
      const sharedKey = x25519.getSharedSecret(x25519PrivateKey, decodeBase64Url(vaultX25519PublicKey));
      const fileMasterKey = hkdf(sha256, sharedKey, undefined, undefined, 32);

      try {
        await upload(fileMasterKey, file, {
          ticket: slot.ticket,
          x25519PublicKey,
        });

        await loadRemoteVault();
        resolve();
      }
      catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Upload complete",
      error: (error) => `Failed to upload: ${(error as Error).message}`,
    });
  }
</script>

{#if vault !== null}
  <div class="flex-1">
    <div class="w-[28rem] mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>{vault.name}</CardTitle>
          <CardDescription>
            <div class="flex items-center text-muted-foreground text-xs">
              {dayjs(vault.createdAt).fromNow()}
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-4">
          {#each vault.slots as slot}
            <UploadEntry vaultSlot={slot} onFile={file => handleFile(slot, file)}/>
          {/each}
        </CardContent>
      </Card>
    </div>
  </div>
{/if}
