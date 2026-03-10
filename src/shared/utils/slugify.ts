export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-');
}
