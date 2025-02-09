type OptionalItem<T> = T | null | undefined;

/**
 * Concatenates multiple Uint8Arrays into a single Uint8Array.
 *
 * @param arrays The Uint8Arrays to concatenate
 */
export function concat(...arrays: OptionalItem<Uint8Array>[]): Uint8Array {
  if (arrays.length <= 1) {
    return arrays[0] ?? new Uint8Array();
  }

  const length = arrays.reduce((carry, array) => carry + (array?.length ?? 0), 0);
  const result = new Uint8Array(length);

  let offset = 0;

  for (const array of arrays) {
    if (typeof array == "undefined" || array === null) {
      continue;
    }

    result.set(array, offset);
    offset += array.length;
  }

  return result;
}
