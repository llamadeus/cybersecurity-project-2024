const PLURALS = {
  "chunk": "chunks",
} as const;

/**
 * Returns the plural form of the given key.
 *
 * @param word Thw word to pluralize
 * @param count The count of the word
 */
export function pluralize(word: keyof typeof PLURALS, count: number): string {
  return count === 1 ? `1 ${word}` : `${count} ${PLURALS[word]}`;
}
