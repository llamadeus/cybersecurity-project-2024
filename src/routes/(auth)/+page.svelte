<script lang="ts">
  import { page } from "$app/stores";
  import { auth } from "$lib/auth";
  import Dropzone from "$lib/components/Dropzone.svelte";
  import LogoutButton from "$lib/components/LogoutButton.svelte";
  import PurgeButton from "$lib/components/PurgeButton.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu";
  import { type RouterOutput, trpc } from "$lib/trpc/client";
  import { cn } from "$lib/utils/components";
  import { formatFileSize } from "$lib/utils/format";
  import { pluralize } from "$lib/utils/plural";
  import dayjs from "dayjs";
  import { EllipsisVertical } from "lucide-svelte";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { getDecryptedFileAttributes, getDecryptedFileKey } from "~/features/storage/file";
  import { upload } from "~/features/storage/upload";


  type RemoteFile = RouterOutput["files"]["files"][number];

  interface DecryptedFile {
    id: string;
    key: Uint8Array;
    name: string;
    type: string;
    size: number;
    chunks: string[];
    createdAt: string;
  }

  let remoteFiles: RemoteFile[] = $state([]);
  let sortedFiles = $derived(remoteFiles.toSorted((a, b) => dayjs(a.createdAt).isBefore(b.createdAt) ? 1 : -1));

  onMount(loadRemoteFiles);

  function handleChange(files: File[]) {
    for (const file of files) {
      processFile(file);
    }
  }

  async function loadRemoteFiles() {
    const result = await trpc($page).files.query();

    remoteFiles = result.files;
  }

  async function processFile(file: File) {
    const promise = new Promise<void>(async (resolve, reject) => {
      if (auth.state === null) {
        throw new Error("Not authenticated");
      }

      try {
        await upload(auth.state.masterKey, file);
        await loadRemoteFiles();

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

  function decrypted(file: RemoteFile): DecryptedFile {
    if (auth.state === null) {
      throw new Error("Not authenticated");
    }

    const fileKey = getDecryptedFileKey(auth.state.masterKey, file);
    const attributes = getDecryptedFileAttributes(auth.state.masterKey, file);

    return {
      id: file.id,
      key: fileKey,
      name: attributes.name,
      type: attributes.type,
      size: attributes.size,
      chunks: attributes.chunks,
      createdAt: file.createdAt,
    };
  }

  function fileSize(df: DecryptedFile) {
    return df.size; // + df.chunks.length * 40;
  }

  let cumulativeSize = $derived.by(() => (
    remoteFiles.reduce((acc, file) => {
      const df = decrypted(file);
      return acc + fileSize(df);
    }, 0)
  ));

  function handleClick(event: MouseEvent) {
    if (event.altKey) {
      event.preventDefault();

      const target: HTMLAnchorElement | null = event.target as HTMLAnchorElement;
      const link = document.createElement("a");

      link.href = `${target.href}?dl=true`;
      link.click();
    }
  }

  function handleView(id: string) {
    const link = document.createElement("a");

    link.href = `/sw/${id}`;
    link.target = "_blank";
    link.click();
  }

  function handleDownload(id: string) {
    const link = document.createElement("a");

    link.href = `/sw/${id}?dl=true`;
    link.click();
  }

  async function handleDelete(df: DecryptedFile) {
    if (confirm("Do you really want to delete this file?")) {
      await trpc().deleteFile.mutate({
        id: df.id,
        chunkIds: df.chunks,
      });
      await loadRemoteFiles();
    }
  }
</script>

<div class="flex-1">
  <div class="w-[48rem] mx-auto">
    <Card>
      <CardHeader>
        <CardTitle>Hello {auth.state?.username}</CardTitle>
        <CardDescription>Storage usage: {formatFileSize(cumulativeSize)}</CardDescription>
      </CardHeader>

      <CardContent>
        <Dropzone onFiles={handleChange}/>

        <div class={cn("flex flex-col gap-5", sortedFiles.length > 0 && "mt-8")}>
          {#each sortedFiles as file}
            {@const df = decrypted(file)}
            <div class="flex gap-2">
              <div class="flex flex-col flex-1 gap-1">
                <div class="flex gap-3">
                  <a
                    class="text-primary text-semibold underline"
                    href={`/sw/${df.id}`}
                    target="_blank"
                    onclick={handleClick}
                  >
                    {df.name}
                  </a>
                  <span class="flex items-center text-muted-foreground text-xs">
                    {dayjs(df.createdAt).fromNow()}
                  </span>
                </div>

                <div class="flex gap-2">
                  <Badge variant="secondary" class="font-semibold">
                    {formatFileSize(fileSize(df))}
                  </Badge>
                  <Badge variant="secondary" class="font-mono">
                    {df.type}
                  </Badge>
                  <Badge variant="secondary">
                    {pluralize("chunk", df.chunks.length)}
                  </Badge>
                </div>
              </div>

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
                      <DropdownMenuItem onclick={() => handleView(df.id)}>View</DropdownMenuItem>
                      <DropdownMenuItem onclick={() => handleDownload(df.id)}>Download</DropdownMenuItem>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem
                        class="text-red-500 data-[highlighted]:text-red-500"
                        onclick={() => handleDelete(df)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          {/each}
        </div>
      </CardContent>

      <CardFooter class="justify-between">
        <PurgeButton onRefetch={loadRemoteFiles}/>
        <LogoutButton/>
      </CardFooter>
    </Card>
  </div>
</div>
