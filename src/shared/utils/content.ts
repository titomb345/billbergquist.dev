export function stripExt(id: string): string {
  return id.replace(/\.mdx?$/, '');
}

export function getBookingMonth(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
    month: 'long',
  });
}

export function formatDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: style,
    day: 'numeric',
    timeZone: 'UTC',
  });
}
