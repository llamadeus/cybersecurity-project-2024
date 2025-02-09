import { type FormControlInit, FormControlState } from "$lib/reform/state/form-control.svelte";
import { getContext, hasContext, setContext } from "svelte";
import type { AnyZodObject } from "zod";


const FORM_CONTROL_CONTEXT_KEY = Symbol();

export function useFormControl<ZodType extends AnyZodObject>(init: FormControlInit<ZodType>) {
  return setContext(FORM_CONTROL_CONTEXT_KEY, new FormControlState(init));
}

export function getFormControl<ZodType extends AnyZodObject>(): FormControlState<ZodType> {
  if (! hasContext(FORM_CONTROL_CONTEXT_KEY)) {
    throw new Error("getFormControl must be used within a FormControl");
  }

  return getContext<FormControlState<ZodType>>(FORM_CONTROL_CONTEXT_KEY);
}
