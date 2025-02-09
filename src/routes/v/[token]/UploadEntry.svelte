<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { formatFileSize } from "$lib/utils/format";
  import { Ban, LoaderCircle, UploadCloud } from "lucide-svelte";


  interface Props {
    vaultSlot: Slot;
    onFile: (file: File) => Promise<void> | void;
  }

  interface Slot {
    name: string;
    maxSize: number;
    available: boolean;
  }

  const props: Props = $props();
  let inputElement = $state<HTMLInputElement | null>(null);
  let loading = $state(false);

  async function handleChange(event: Event) {
    if (! props.vaultSlot.available) {
      return;
    }

    const target = event.target as HTMLInputElement;
    if (target.files === null) {
      return;
    }

    const [file] = target.files;
    if (typeof file == "undefined") {
      return;
    }

    try {
      loading = true;
      await props.onFile(file);
    }
    finally {
      target.value = "";
      loading = false;
    }
  }
</script>

<div class="flex gap-2">
  <div class="flex flex-col flex-1 gap-1">
    <div class="flex gap-3 text-semibold">
      {props.vaultSlot.name}
    </div>

    <div class="flex gap-2">
      {#if ! props.vaultSlot.available}
        <Badge class="font-semibold">
          uploaded
        </Badge>
      {/if}
      <Badge variant="secondary" class="font-semibold">
        max. {formatFileSize(props.vaultSlot.maxSize)}
      </Badge>
    </div>
  </div>

  <div class="flex gap-2 items-center">
    <Button
      variant="outline"
      class="w-9 h-9 p-0 rounded-full"
      onclick={() => props.vaultSlot.available && inputElement?.click()}
      disabled={loading || ! props.vaultSlot.available}
    >
      {#if ! props.vaultSlot.available}
        <Ban/>
      {:else}
        {#if loading}
          <LoaderCircle class="animate-spin"/>
        {:else}
          <UploadCloud/>
        {/if}
      {/if}
    </Button>

    <input bind:this={inputElement} type="file" onchange={handleChange} hidden/>
  </div>
</div>
