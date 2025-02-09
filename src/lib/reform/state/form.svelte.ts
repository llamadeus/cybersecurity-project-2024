import type { allKeys } from "$lib/reform/types";
import { type AnyZodObject, z } from "zod";


interface FormOptions<ZodType extends AnyZodObject> {
  schema: ZodType;
  initialState: z.infer<ZodType>;
  onSubmit?: (data: z.infer<ZodType>) => Promise<void> | void;
}

type ErrorMap<ZodType extends AnyZodObject> = Partial<Record<allKeys<z.infer<ZodType>>, string>>;

export class FormState<ZodType extends AnyZodObject> {
  readonly #state: z.infer<ZodType> = $state({});
  #errors = $state<ErrorMap<ZodType>>({});
  #submitting = $state(false);
  readonly props = $derived.by(() => ({
    onsubmit: async (event: Event) => {
      event.preventDefault();

      const values = this.values();

      this.revalidate(values);

      if (! this.hasErrors()) {
        this.#submitting = true;

        try {
          await this.options.onSubmit?.(values);
        }
        catch (error) {
          throw error;
        }
        finally {
          this.#submitting = false;
        }
      }
    },
  }));

  constructor(private readonly options: FormOptions<ZodType>) {
    this.#state = options.initialState;
  }

  get state(): z.infer<ZodType> {
    return this.#state;
  }

  get errors(): ErrorMap<ZodType> {
    return this.#errors;
  }

  get submitting(): boolean {
    return this.#submitting;
  }

  values(): z.infer<ZodType> {
    return $state.snapshot(this.state) as z.infer<ZodType>;
  }

  revalidate(values = this.values()): void {
    const result = this.options.schema.safeParse(values);
    if (result.success) {
      return;
    }

    const { fieldErrors } = result.error.flatten();
    const errors = Object.entries(fieldErrors).reduce((carry, [key, value]) => {
      if (typeof value == "undefined") {
        return carry;
      }

      return {
        ...carry,
        [key]: value[0],
      };
    }, {});

    this.setErrors(errors);
  }

  setErrors(errors: ErrorMap<ZodType>): void {
    this.#errors = errors;
  }

  setFieldError(field: allKeys<z.infer<ZodType>>, error: string): void {
    this.#errors[field] = error;
  }

  hasError(field: allKeys<z.infer<ZodType>>): boolean {
    return this.#errors[field] !== undefined;
  }

  hasErrors(): boolean {
    return Object.keys(this.#errors).length > 0;
  }

  resetError(field: allKeys<z.infer<ZodType>>): void {
    delete this.#errors[field];
  }
}
