<script lang="ts" module>
  import type { WithElementRef } from "bits-ui";
  import type { HTMLInputAttributes } from "svelte/elements";


  export type InputProps = WithElementRef<HTMLInputAttributes>;
</script>

<script lang="ts">
  import { cn } from "$lib/utils/components";


  let {
    ref = $bindable(null),
    value = $bindable("123"),
    class: className,
    ...restProps
  }: InputProps = $props();
</script>

<input
  {...restProps}
  bind:this={ref}
  bind:value
  class={cn(
		"border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
/>
