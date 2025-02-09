<script lang="ts" module>
  import { type allKeys } from "$lib/reform/types";
  import { type AnyZodObject, z } from "zod";


  type ZodType = AnyZodObject;
  type Field = allKeys<z.infer<ZodType>>;
</script>

<script
  lang="ts"
  generics="ZodType extends AnyZodObject, Field extends allKeys<z.infer<ZodType>> = allKeys<z.infer<ZodType>>"
>
  import { useFormControl } from "$lib/reform/context";
  import type { FormControlAttributes } from "$lib/reform/state/form-control.svelte";
  import type { FormState } from "$lib/reform/state/form.svelte";
  import { cn } from "$lib/utils/components";
  import { type Snippet } from "svelte";


  interface ChildrenArgs {
    props: FormControlAttributes;
    error: string | null;
  }

  interface Props {
    id?: string;
    form: FormState<ZodType>;
    field: Field & string;
    class?: string;
    children?: Snippet<[ChildrenArgs]>;
  }

  const {
    id = `rf-${Math.random().toString(36).substring(2)}`,
    form,
    field,
    class: className,
    children,
  }: Props = $props();

  const control = useFormControl({
    form,
    field,
    id,
  });
</script>

<div class={cn("group/control space-y-1", className)} data-rf-error={control.error !== null}>
  {@render children?.({ props: control.props, error: control.error })}
</div>
