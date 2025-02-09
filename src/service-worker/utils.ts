/**
 * Encodes the given filename for RFC 5987 compliance.
 *
 * @param filename
 */
export function encodeFilename(filename: string) {
  // RFC 5987 specifies using UTF-8 and percent encoding for extended filenames
  // Use encodeURIComponent for non-ASCII characters and special characters
  return encodeURIComponent(filename).replace(/['()]/g, (char) => (
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  ));
}
