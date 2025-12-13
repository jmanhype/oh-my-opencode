/**
 * Check if a directory entry is a markdown file.
 * Excludes hidden files (starting with .)
 */
export function isMarkdownFile(entry: { name: string; isFile: () => boolean }): boolean {
  return !entry.name.startsWith(".") && entry.name.endsWith(".md") && entry.isFile()
}
