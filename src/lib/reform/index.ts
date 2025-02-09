import { FormState } from "$lib/reform/state/form.svelte";
import { type AnyZodObject, z } from "zod";


export interface ReformOptions<ZodType extends AnyZodObject> {
  schema: ZodType;
  initialState: z.infer<ZodType>;
  onSubmit?: (data: z.infer<ZodType>) => void;
}

export function reform<ZodType extends AnyZodObject>(options: ReformOptions<ZodType>): FormState<ZodType> {
  return new FormState<ZodType>(options);
}
