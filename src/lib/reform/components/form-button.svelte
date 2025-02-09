<script lang="ts">
  import { Button, type ButtonProps } from "$lib/components/ui/button";


  let {
    class: className,
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

<Button {...restProps} type="submit">
  {@render children?.()}
</Button>
