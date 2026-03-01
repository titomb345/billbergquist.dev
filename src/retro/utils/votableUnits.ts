import type { Card, CardGroup } from '../types';

export type VotableUnit =
  | { type: 'single'; card: Card }
  | { type: 'group'; group: CardGroup; cards: Card[] };

export function computeVotableUnits(cards: Card[], groups: CardGroup[]): VotableUnit[] {
  const seenGroups = new Set<string>();
  const units: VotableUnit[] = [];

  // Add groups first
  for (const group of groups) {
    if (seenGroups.has(group.id)) continue;
    seenGroups.add(group.id);

    const groupCards = group.cardIds
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is Card => c != null);

    if (groupCards.length > 0) {
      units.push({ type: 'group', group, cards: groupCards });
    }
  }

  // Add ungrouped cards
  for (const card of cards) {
    if (!card.groupId) {
      units.push({ type: 'single', card });
    }
  }

  return units;
}

export function sortVotableUnits(units: VotableUnit[]): VotableUnit[] {
  return [...units].sort((a, b) => {
    const aVotes = a.type === 'single' ? a.card.votes : (a.cards[0]?.votes ?? 0);
    const bVotes = b.type === 'single' ? b.card.votes : (b.cards[0]?.votes ?? 0);
    return bVotes - aVotes;
  });
}
