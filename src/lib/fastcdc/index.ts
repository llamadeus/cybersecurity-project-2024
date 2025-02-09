import { createTable } from "$lib/fastcdc/table";
import type { Chunk, Options } from "$lib/fastcdc/types";
import { concat } from "$lib/tulip/utils/buffer";


const MIN_SIZE = 64;
const MAX_SIZE = 1 << 30; // 1GiB

/**
 * Chunks the given data using FastCDC and a rolling Gear hash.
 * See https://en.wikipedia.org/wiki/Rolling_hash#Gear_fingerprint_and_content-based_chunking_algorithm_FastCDC
 * Paper https://www.usenix.org/system/files/conference/atc16/atc16-paper-xia.pdf
 * Based on https://github.com/jotfs/fastcdc-go/tree/v0.2.0
 *
 * @param data
 * @param options
 */
export function* fastCDC(data: Uint8Array, options: Options): Generator<Chunk> {
  const { averageSize, minSize, maxSize, normalization, seed } = setDefaults(options);
  const [maskBelow, maskAbove] = computeBitmasks(averageSize, normalization);
  const table = createTable(seed);

  let fingerprint = 0n;
  let start = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (typeof value == "undefined") {
      throw new Error("Should never happen");
    }

    const len = i - start + 1; // one for the bias, jk
    const isBelowMinSize = len < minSize;
    const isLastByte = i === data.length - 1;

    const lookup = table[value];
    if (typeof lookup == "undefined") {
      throw new Error("Should never happen");
    }

    // Compute Gear hash
    fingerprint = BigInt.asUintN(64, (fingerprint << 1n) + lookup);

    // Skip the first minSize bytes, and kickstart the hash
    if (isBelowMinSize && ! isLastByte) {
      continue;
    }

    const mask = len < averageSize ? maskBelow : maskAbove;
    const isBoundary = isChunkBoundary(fingerprint, mask);
    const isMaxSizeExceeded = len >= maxSize;

    // Yield if there is either a natural boundary, the max size is exceeded or we are at the end of the data
    if (isBoundary || isMaxSizeExceeded || isLastByte) {
      yield {
        data: data.subarray(start, i + 1),
        fingerprint: fingerprint,
      };

      start = i + 1;
      fingerprint = 0n;
    }
  }
}

/**
 * Chunks the data from the given reader using FastCDC and a rolling Gear hash.
 *
 * @param reader
 * @param options
 */
export async function* fastCDC2(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: Options,
): AsyncGenerator<Chunk> {
  const { averageSize, minSize, maxSize, normalization, seed } = setDefaults(options);
  const [maskBelow, maskAbove] = computeBitmasks(averageSize, normalization);
  const table = createTable(seed);

  let fingerprint = 0n;
  let previous: Uint8Array[] = [];
  let byteCounter = 0;

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      if (previous.length > 0) {
        yield {
          data: concat(...previous),
          fingerprint: fingerprint,
        };
      }

      break;
    }

    for (let i = 0, start = 0; i < value.length; i++) {
      byteCounter++;

      const byte = value[i];
      if (typeof byte == "undefined") {
        throw new Error("Should never happen");
      }

      const lookup = table[byte];
      if (typeof lookup == "undefined") {
        throw new Error("Should never happen");
      }

      const isBelowMinSize = byteCounter < minSize;
      const isLastByte = i === value.length - 1;

      // Compute Gear hash
      fingerprint = BigInt.asUintN(64, (fingerprint << 1n) + lookup);

      // Skip the first minSize bytes, and kickstart the hash
      if (isBelowMinSize && ! isLastByte) {
        continue;
      }

      const mask = byteCounter < averageSize ? maskBelow : maskAbove;
      const isBoundary = isChunkBoundary(fingerprint, mask);
      const isMaxSizeExceeded = byteCounter >= maxSize;

      // Yield if there is either a natural boundary or the max size is exceeded
      if (isBoundary || isMaxSizeExceeded) {
        const part = value.subarray(start, i + 1);
        const data = concat(...previous, part);

        yield {
          data,
          fingerprint,
        };

        fingerprint = 0n;
        start = i + 1;
        byteCounter = 0;
        previous = [];
      }
      else if (isLastByte) {
        previous.push(value.subarray(start, i + 1));
      }
    }
  }
}

/**
 * Set the defaults for the given options.
 * Also checks, whether the given values are valid.
 *
 * @param options
 */
function setDefaults(options: Options): Required<Options> {
  const { averageSize } = options;
  const {
    minSize = Math.floor(averageSize / 4),
    maxSize = Math.floor(averageSize * 4),
    normalization = 2,
    seed = 0n,
  } = options;

  if (averageSize <= 0) {
    throw new Error("averageSize must be greater than 0");
  }
  if (minSize < MIN_SIZE || minSize > MAX_SIZE) {
    throw new Error("minSize must be in range 64B to 1GiB");
  }
  if (maxSize < MIN_SIZE || maxSize > MAX_SIZE) {
    throw new Error("maxSize must be in range 64B to 1GiB");
  }
  if (maxSize <= minSize) {
    throw new Error("minSize must be less than option maxSize");
  }
  if (averageSize > maxSize || averageSize < minSize) {
    throw new Error("averageSize must be between minSize and maxSize");
  }

  return {
    averageSize,
    minSize,
    maxSize,
    normalization,
    seed,
  };
}

/**
 * Computes two bitmasks for chunk boundary determination.
 * The first bitmask should be used for when the current chunk length is below the given average size, while the second
 * bitmask is for when it's above.
 *
 * @param averageSize
 * @param normalization
 */
function computeBitmasks(averageSize: number, normalization: 0 | 1 | 2 | 3): [bigint, bigint] {
  const bits = Math.round(Math.log2(averageSize));
  const smallBits = bits + normalization;
  const largeBits = bits - normalization;
  const maskBelow = BigInt((1 << smallBits) - 1);
  const maskAbove = BigInt((1 << largeBits) - 1);

  return [
    maskBelow,
    maskAbove,
  ];
}

/**
 * Checks if a fingerprint defines a chunk boundary.
 *
 * @param fingerprint
 * @param mask
 */
function isChunkBoundary(fingerprint: bigint, mask: bigint): boolean {
  return (fingerprint & mask) == 0n;
}
