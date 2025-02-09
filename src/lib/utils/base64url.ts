// base64url characters
const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
const BASE64_LOOKUP = BASE64.split("");
const BASE64_REVERSE_LOOKUP = BASE64_LOOKUP.reduce<number[]>((acc, char, index) => {
  acc[char.charCodeAt(0)] = index;

  return acc;
}, []);

/**
 * Encodes the given data as base64url.
 *
 * @param data The data to encode
 */
export function encodeBase64Url(data: Uint8Array): string {
  const cutoff = data.length % 3;
  let result = "";
  let i = 0;

  do { // pack three octets into four hexets
    const o1 = data.at(i++) ?? 0;
    const o2 = data.at(i++) ?? 0;
    const o3 = data.at(i++) ?? 0;
    const bits = o1 << 16 | o2 << 8 | o3;

    const h1 = bits >> 18 & 0x3f;
    const h2 = bits >> 12 & 0x3f;
    const h3 = bits >> 6 & 0x3f;
    const h4 = bits & 0x3f;

    // Use hexets to index into b64, and append result to encoded string
    result += BASE64_LOOKUP[h1]! + BASE64_LOOKUP[h2] + BASE64_LOOKUP[h3] + BASE64_LOOKUP[h4];
  } while (i < data.length);

  return cutoff > 0 ? result.slice(0, cutoff - 3) : result;
}

/**
 * Decodes the given base64url encoded data.
 *
 * @param data The data to decode
 */
export function decodeBase64Url(data: string): Uint8Array {
  let length = data.indexOf("=");
  if (length === -1) {
    length = data.length;
  }

  if (length === 0) {
    return new Uint8Array();
  }

  const padding = "==".substring((2 - data.length * 3) & 3);
  const result: number[] = [];
  let i = 0;
  let j = 0;

  // Append possible padding
  data += padding;

  do {
    // Unpack four hexets into three octets using index points in b64
    const h1 = BASE64_REVERSE_LOOKUP[data.charCodeAt(i++)] ?? 0;
    const h2 = BASE64_REVERSE_LOOKUP[data.charCodeAt(i++)] ?? 0;
    const h3 = BASE64_REVERSE_LOOKUP[data.charCodeAt(i++)] ?? 0;
    const h4 = BASE64_REVERSE_LOOKUP[data.charCodeAt(i++)] ?? 0;
    const bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

    const o1 = bits >> 16 & 0xff;
    const o2 = bits >> 8 & 0xff;
    const o3 = bits & 0xff;

    if (h3 === 64) {
      result[j++] = o1;
    }
    else if (h4 === 64) {
      result[j++] = o1;
      result[j++] = o2;
    }
    else {
      result[j++] = o1;
      result[j++] = o2;
      result[j++] = o3;
    }
  } while (i < data.length);

  return new Uint8Array(result);
}
