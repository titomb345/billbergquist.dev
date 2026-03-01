import type { RoomState } from '../types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function exportAsMarkdown(room: RoomState): string {
  const date = formatDate(room.createdAt);
  const lines: string[] = [];

  lines.push(`# RetroRetro Summary`);
  lines.push(`**Room:** ${room.roomCode} | **Date:** ${date}`);
  lines.push(`**Participants:** ${room.participants.map((p) => p.name).join(', ')}`);
  lines.push('');

  for (const col of room.columns) {
    const cards = room.cards
      .filter((c) => c.columnId === col.id)
      .sort((a, b) => b.votes - a.votes);

    lines.push(`## ${col.label}`);
    if (cards.length === 0) {
      lines.push('_No cards_');
    } else {
      for (const card of cards) {
        const votes = card.votes > 0 ? ` [${card.votes} vote${card.votes > 1 ? 's' : ''}]` : '';
        const author = card.authorName ? ` _(${card.authorName})_` : '';
        lines.push(`- ${card.text}${votes}${author}`);
      }
    }
    lines.push('');
  }

  if (room.groups.length > 0) {
    lines.push('## Card Groups');
    for (const group of room.groups) {
      const groupCards = room.cards.filter((c) => c.groupId === group.id);
      const votes = groupCards[0]?.votes ?? 0;
      const voteSuffix = votes > 0 ? ` [${votes} vote${votes > 1 ? 's' : ''}]` : '';
      const label = group.label || `Group`;
      lines.push(`### ${label}${voteSuffix}`);
      for (const card of groupCards) {
        const col = room.columns.find((c) => c.id === card.columnId);
        const colLabel = col ? ` (${col.label})` : '';
        const author = card.authorName ? ` _(${card.authorName})_` : '';
        lines.push(`- ${card.text}${colLabel}${author}`);
      }
    }
    lines.push('');
  }

  if (room.actionItems.length > 0) {
    lines.push('## Action Items');
    for (const item of room.actionItems) {
      const check = item.completed ? 'x' : ' ';
      const assignee = item.assignee ? ` (@${item.assignee})` : '';
      lines.push(`- [${check}] ${item.text}${assignee}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('_Exported from RetroRetro_');

  return lines.join('\n');
}

export function exportAsJson(room: RoomState): string {
  const data = {
    tool: 'RetroRetro',
    roomCode: room.roomCode,
    createdAt: room.createdAt,
    date: formatDate(room.createdAt),
    participants: room.participants.map((p) => ({ name: p.name, isHost: p.isHost })),
    columns: room.columns.map((col) => ({
      label: col.label,
      cards: room.cards
        .filter((c) => c.columnId === col.id)
        .sort((a, b) => b.votes - a.votes)
        .map((c) => ({
          text: c.text,
          author: c.authorName,
          votes: c.votes,
        })),
    })),
    groups: room.groups.map((g) => ({
      label: g.label,
      votes: room.cards.find((c) => c.id === g.cardIds[0])?.votes ?? 0,
      cards: g.cardIds.map((id) => {
        const card = room.cards.find((c) => c.id === id);
        const col = room.columns.find((c) => c.id === card?.columnId);
        return { text: card?.text, column: col?.label, author: card?.authorName };
      }),
    })),
    actionItems: room.actionItems.map((a) => ({
      text: a.text,
      assignee: a.assignee,
      completed: a.completed,
    })),
  };

  return JSON.stringify(data, null, 2);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isoDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function downloadMarkdown(room: RoomState) {
  const content = exportAsMarkdown(room);
  downloadFile(content, `retro-${isoDate(room.createdAt)}.md`, 'text/markdown');
}

export function downloadJson(room: RoomState) {
  const content = exportAsJson(room);
  downloadFile(content, `retro-${isoDate(room.createdAt)}.json`, 'application/json');
}

export function copyMarkdownToClipboard(room: RoomState): Promise<void> {
  const content = exportAsMarkdown(room);
  return navigator.clipboard.writeText(content);
}
