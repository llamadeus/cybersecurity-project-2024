<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import { getFormControl } from "$lib/reform/context";
  import { cn } from "$lib/utils/components";
  import type { Label as LabelPrimitive } from "bits-ui";


  const { class: className, children, ...restProps }: LabelPrimitive.RootProps = $props();
  const control = getFormControl();
</script>

<Label
  {...restProps}
  for={control.props.id}
  class={cn("group-data-[rf-error=true]/control:text-destructiv", className)}
>
  {@render children?.()}
</Label>
