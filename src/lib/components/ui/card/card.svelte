<script lang="ts">
  import { cn } from "$lib/utils/components";
  import type { WithElementRef } from "bits-ui";
  import type { HTMLAttributes } from "svelte/elements";


  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  {...restProps}
  bind:this={ref}
  class={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}
>
  {@render children?.()}
</div>
