<script lang="ts">
  import { cn } from "$lib/utils/components";
  import { randomString } from "$lib/utils/id";
  import { CloudUpload } from "lucide-svelte";


  interface Props {
    class?: string;
    onFiles?: (files: File[]) => void;
  }

  const id = randomString(7);
  const { class: className, onFiles }: Props = $props();
  let inputElement = $state<HTMLInputElement | null>(null);
  let dragOver = $state(false);

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files === null) {
      return;
    }

    onFiles?.([...target.files]);
    target.value = "";
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    dragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;

    if (event.dataTransfer === null) {
      return;
    }

    onFiles?.([...event.dataTransfer.files]);
  }
</script>

<div
  role="button"
  class={cn(
    "flex justify-center rounded-lg border border-dashed border-gray-900/25 transition-all px-6 py-10 cursor-pointer duration-25",
    "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    dragOver && "border-indigo-600",
    className,
  )}
  tabindex="0"
  onclick={() => inputElement?.click()}
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  onkeydown={(event) => event.key === " " && inputElement?.click()}
>
  <div class="text-center">
    <CloudUpload class="mx-auto size-12 text-gray-300"/>

    <div class="mt-4 flex text-sm/6 text-gray-600">
      <span class="font-semibold text-indigo-600  hover:text-indigo-500">
        Upload a file
      </span>
      <p class="pl-1">or drag and drop</p>
    </div>
    <p class="text-xs/5 text-gray-600">Any file, any size</p>

    <input bind:this={inputElement} id={id} type="file" onchange={handleChange} multiple hidden>
  </div>
</div>
