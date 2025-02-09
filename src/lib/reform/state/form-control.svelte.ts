import type { FormState } from "$lib/reform/state/form.svelte";
import type { allKeys } from "$lib/reform/types";
import { untrack } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";
import { type AnyZodObject, z } from "zod";


export interface FormControlInit<ZodType extends AnyZodObject> {
  form: FormState<ZodType>;
  field: allKeys<z.infer<ZodType>>;
  id: string;
}

export type FormControlAttributes = HTMLInputAttributes;

export class FormControlState<ZodType extends AnyZodObject> {
  private readonly form: FormState<ZodType>;
  private readonly field: allKeys<z.infer<ZodType>>;
  private readonly id: string;

  /**
   * The props to be passed to the control.
   */
  readonly props = $derived.by(() => ({
    id: this.id,
    name: this.field as string,
    class: "group-data-[rf-error=true]/control:border-destructive",

    // name: this.field.name,
    // 'data-fs-error': getDataFsError(this.field.errors),
    // 'aria-describedby': getAriaDescribedBy({
    //   fieldErrorsId: this.field.errorNode?.id,
    //   descriptionId: this.field.descriptionNode?.id,
    //   errors: this.field.errors,
    // }),
    // 'aria-invalid': getAriaInvalid(this.field.errors),
    // 'aria-required': getAriaRequired(this.field.constraints),
    // 'data-fs-control': '',
  }) satisfies FormControlAttributes);

  constructor(init: FormControlInit<ZodType>) {
    this.form = init.form;
    this.field = init.field;
    this.id = init.id;

    $effect(() => {
      // Mark the value as a dependency for this effect
      this.value;

      if (untrack(() => this.error) !== null) {
        untrack(() => this.form.resetError(this.field));
      }
    });
  }

  get value() {
    return this.form.state[this.field];
  }

  get error() {
    return this.form.errors[this.field] ?? null;
  }
}
