/**
 * Formats a file size in bytes to a human-readable format.
 *
 * @param sizeInBytes
 */
export function formatFileSize(sizeInBytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1000 && unitIndex < units.length - 1) {
    size /= 1000;
    unitIndex++;
  }

  return `${parseFloat(size.toFixed(2))} ${units[unitIndex]}`;
}

/**
 * Parses a file size string into a number of bytes.
 *
 * @param size
 */
export function parseFileSize(size: string): number {
  const normalized = size.trim().toLowerCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)$/);
  if (match === null) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const [, valueStr, unit] = match;
  if (typeof valueStr == "undefined" || typeof unit == "undefined") {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseFloat(valueStr);
  const unitMap: { [key: string]: number } = {
    kb: 1000,
    mb: 1000 * 1000,
    gb: 1000 * 1000 * 1000,
  };

  return value * (unitMap[unit] ?? 1);
}
