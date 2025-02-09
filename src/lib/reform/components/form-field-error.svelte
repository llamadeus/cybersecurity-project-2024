<script lang="ts">
  import { getFormControl } from "$lib/reform/context";
  import { cn } from "$lib/utils/components";
  import type { WithElementRef } from "bits-ui";
  import type { HTMLAttributes } from "svelte/elements";


  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
  const control = getFormControl();
</script>

{#if control.error}
  <div bind:this={ref} class={cn("text-destructive text-xs", className)} {...restProps}>
    {control.error}
  </div>
{/if}
