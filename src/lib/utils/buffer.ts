export function expand(bytes: Uint8Array, length: number): Uint8Array {
  if (length < bytes.length) {
    throw new Error("The specified length cannot be smaller than the input array's length.");
  }

  if (length === bytes.length) {
    return bytes;
  }

  const result = new Uint8Array(length);
  const start = length - bytes.length;

  result.set(bytes, start);

  return result;
}
