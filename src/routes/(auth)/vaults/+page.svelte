<script lang="ts">
  import { page } from "$app/stores";
  import { env } from "$env/dynamic/public";
  import { auth, onReady } from "$lib/auth";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { CardFooter } from "$lib/components/ui/card/index.js";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { trpc } from "$lib/trpc/client";
  import { decrypt } from "$lib/tulip";
  import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url";
  import { formatFileSize } from "$lib/utils/format";
  import { pluralize } from "$lib/utils/plural";
  import { bytesToUtf8 } from "@noble/ciphers/utils";
  import { x25519 } from "@noble/curves/ed25519";
  import { hkdf } from "@noble/hashes/hkdf";
  import { sha256 } from "@noble/hashes/sha2";
  import dayjs from "dayjs";
  import { EllipsisVertical } from "lucide-svelte";
  import { getDecryptedFileAttributes, getDecryptedFileKey } from "~/features/storage/file";
  import CreateVaultButton from "~/features/vaults/components/CreateVaultButton.svelte";


  interface DecryptedVault {
    id: string;
    token: string;
    name: string;
    key: string;
    createdAt: string;
    slots: DecryptedSlot[];
  }

  interface DecryptedSlot {
    id: string;
    name: string;
    maxSize: number;
    file: DecryptedFile | null;
    createdAt: string;
  }

  interface DecryptedFile {
    id: string;
    key: Uint8Array;
    name: string;
    type: string;
    size: number;
    chunks: string[];
    createdAt: string;
  }

  let vaults: DecryptedVault[] = $state([]);
  let sortedVaults = $derived(vaults.toSorted((a, b) => dayjs(a.createdAt).isBefore(b.createdAt) ? 1 : -1));

  onReady(loadRemoteVaults);

  async function loadRemoteVaults() {
    if (auth.state === null) {
      throw new Error("Not authenticated");
    }

    const x25519PrivateKey = auth.state.x25519PrivateKey;
    const result = await trpc($page).vaults.query();

    vaults = [];

    for (const vault of result.vaults) {
      const [vaultKey] = decrypt(auth.state.masterKey, decodeBase64Url(vault.key));
      const [decryptedAttributes] = decrypt(vaultKey, decodeBase64Url(vault.attributes));
      const attributes = JSON.parse(bytesToUtf8(decryptedAttributes));

      vaults.push({
        id: vault.id,
        token: vault.token,
        name: attributes.name,
        key: encodeBase64Url(vaultKey),
        createdAt: vault.createdAt,
        slots: vault.slots.map((slot) => {
          const [decryptedAttributes] = decrypt(vaultKey, decodeBase64Url(slot.attributes));
          const attributes = JSON.parse(bytesToUtf8(decryptedAttributes));
          const sharedSecret = slot.fileX25519PublicKey !== null
            ? x25519.getSharedSecret(x25519PrivateKey, decodeBase64Url(slot.fileX25519PublicKey))
            : null;
          const fileMasterKey = sharedSecret !== null
            ? hkdf(sha256, sharedSecret, undefined, undefined, 32)
            : null;
          let file: DecryptedFile | null = null;

          if (fileMasterKey !== null && slot.file !== null) {
            const fileKey = getDecryptedFileKey(fileMasterKey, slot.file);
            const attributes = getDecryptedFileAttributes(fileMasterKey, slot.file);

            file = {
              id: slot.file.id,
              key: fileKey,
              name: attributes.name,
              type: attributes.type,
              size: attributes.size,
              chunks: attributes.chunks,
              createdAt: slot.file.createdAt,
            };
          }

          return ({
            file,
            id: slot.id,
            name: attributes.name,
            maxSize: slot.maxSize,
            createdAt: slot.createdAt,
          });
        }),
      });
    }
  }

  async function handleDelete(vault: DecryptedVault) {
    if (confirm("Do you really want to delete this vault?")) {
      const chunkIds = vault.slots.flatMap((slot) => slot.file?.chunks ?? []);

      await trpc().deleteVault.mutate({
        id: vault.id,
      });
      await loadRemoteVaults();
    }
  }

  function handleClick(event: MouseEvent) {
    if (event.altKey) {
      event.preventDefault();

      const target: HTMLAnchorElement | null = event.target as HTMLAnchorElement;
      const link = document.createElement("a");

      link.href = `${target.href}?dl=true`;
      link.click();
    }
  }

  function handleView(slot: DecryptedSlot) {
    const link = document.createElement("a");

    link.href = `/sw/v/${slot.id}`;
    link.target = "_blank";
    link.click();
  }

  function handleDownload(slot: DecryptedSlot) {
    const link = document.createElement("a");

    link.href = `/sw/v/${slot.id}?dl=true`;
    link.click();
  }

  async function handleClear(slot: DecryptedSlot) {
    if (confirm("Do you really want to clear this slot?")) {
      await trpc($page).clearSlot.mutate({
        id: slot.id,
      });
      await loadRemoteVaults();
    }
  }

  async function handleDeleteVault(vault: DecryptedVault) {
    if (confirm("Do you really want to delete this vault and all of its contents?")) {
      await trpc($page).deleteVault.mutate({
        id: vault.id,
      });
      await loadRemoteVaults();
    }
  }
</script>

<div class="flex-1">
  <div class="flex flex-col w-[48rem] mx-auto gap-8">
    <Card>
      <div class="flex gap-4">
        <CardHeader class="flex-1">
          <CardTitle>Your Public Vaults</CardTitle>
          <CardDescription>
            Here you can manage your public vaults into which other people can upload files.
          </CardDescription>
        </CardHeader>

        <CardHeader>
          <CreateVaultButton onRefetch={loadRemoteVaults}/>
        </CardHeader>
      </div>

      <CardFooter/>
    </Card>

    {#each sortedVaults as vault}
      <Card>
        <div class="flex gap-4">
          <CardHeader class="flex-1">
            <CardTitle>{vault.name}</CardTitle>
            <CardDescription>
              <div class="flex items-center text-muted-foreground text-xs">
                {dayjs(vault.createdAt).fromNow()}
              </div>
              <div>

                <Label>
                  Vault URL
                </Label>
                <Input
                  value={`${env.PUBLIC_APP_URL}/v/${vault.token}#${vault.key}`}
                  onclick={event => (event.target as HTMLInputElement).select()}
                  readonly
                />
              </div>
            </CardDescription>
          </CardHeader>

          <CardHeader>
            <DropdownMenu>
              <DropdownMenuTrigger>
                {#snippet child({ props })}
                  <Button
                    variant="outline"
                    class="w-9 h-9 p-0 rounded-full"
                    {...props}
                  >
                    <EllipsisVertical/>
                  </Button>
                {/snippet}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    class="text-red-500 data-[highlighted]:text-red-500"
                    onclick={() => handleDeleteVault(vault)}
                  >
                    Delete vault
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
        </div>

        <CardContent>
          <div class="flex flex-col gap-5">
            {#each vault.slots as slot}
              <div class="flex gap-2">
                <div class="flex flex-col flex-1 gap-1">
                  <div class="flex gap-3">
                    {#if slot.file !== null}
                      <a
                        class="text-primary text-semibold underline"
                        href={`/sw/v/${slot.id}`}
                        target="_blank"
                        onclick={handleClick}
                      >
                        {slot.name}
                      </a>
                    {:else}
                      <div class="text-semibold">
                        {slot.name}
                      </div>
                    {/if}
                    <span class="flex items-center text-muted-foreground text-xs">
                      {#if slot.file !== null}
                        {dayjs(slot.file.createdAt).fromNow()}
                      {:else}
                        no upload so far
                      {/if}
                    </span>
                  </div>

                  <div class="flex gap-2">
                    <Badge variant="secondary" class="font-semibold">
                      {#if slot.file !== null}
                        {formatFileSize(slot.file?.size ?? 0)}
                        /
                      {:else}
                        max.
                      {/if}
                      {formatFileSize(slot.maxSize)}
                    </Badge>
                    {#if slot.file !== null}
                      <Badge variant="secondary" class="font-mono">
                        {slot.file.type}
                      </Badge>
                      <Badge variant="secondary">
                        {pluralize("chunk", slot.file.chunks.length)}
                      </Badge>
                    {/if}
                  </div>
                </div>

                {#if slot.file !== null}
                  <div class="flex gap-2 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        {#snippet child({ props })}
                          <Button
                            variant="outline"
                            class="w-9 h-9 p-0 rounded-full"
                            {...props}
                          >
                            <EllipsisVertical/>
                          </Button>
                        {/snippet}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          <DropdownMenuItem onclick={() => handleView(slot)}>View</DropdownMenuItem>
                          <DropdownMenuItem onclick={() => handleDownload(slot)}>Download</DropdownMenuItem>
                          <DropdownMenuSeparator/>
                          <DropdownMenuItem
                            class="text-red-500 data-[highlighted]:text-red-500"
                            onclick={() => handleClear(slot)}
                          >
                            Clear
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
