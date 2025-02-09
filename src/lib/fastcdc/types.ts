export type Table = bigint[];


export interface Options {
  // Target chunk size. Typically, a power of 2. It must be in the range 64B to 1GiB
  averageSize: number;

  // (Optional) The minimum allowed chunk size. By default, it's set to averageSize / 4.
  minSize?: number;

  // (Optional) The maximum allowed chunk size. By default, it's set to averageSize * 4.
  maxSize?: number;

  // (Optional) Sets the chunk normalization level. It may be set to 0, 1, 2 or 3. By default, it's set to 2.
  normalization?: 0 | 1 | 2 | 3;

  // (Optional) Alters the lookup table of the rolling hash algorithm to mitigate chunk-size based fingerprinting
  // attacks. It may be set to a random uint64.
  seed?: bigint;
}

export interface Chunk {
  // This chunk's data.
  data: Uint8Array;

  // Rolling hash for this chunk.
  fingerprint: bigint;
}
