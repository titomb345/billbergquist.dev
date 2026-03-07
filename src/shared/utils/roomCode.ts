export function getInitialRoomCode(appPrefix: string): string | null {
  const pathMatch = window.location.pathname.match(new RegExp(`^/${appPrefix}/([A-Z0-9]{4})$`, 'i'));
  if (pathMatch) return pathMatch[1].toUpperCase();
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.toUpperCase() ?? null;
}
