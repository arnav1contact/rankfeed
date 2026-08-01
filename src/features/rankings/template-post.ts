import type { FeedPost } from '@/src/features/feed/types';
import type { RankingTemplate } from '@/src/mock-data';

const topicColors: Record<string, { accentColor: string; backgroundColor: string; emoji: string }> = {
  Culture: { accentColor: '#D9A7FF', backgroundColor: '#362143', emoji: '⚡' },
  Food: { accentColor: '#FFCB6B', backgroundColor: '#3A1D22', emoji: '🍽️' },
  Games: { accentColor: '#A8F0C6', backgroundColor: '#183A35', emoji: '🎲' },
  Gaming: { accentColor: '#9CC5FF', backgroundColor: '#203051', emoji: '🎮' },
  Movies: { accentColor: '#FF9CC9', backgroundColor: '#3B2033', emoji: '🎬' },
  Music: { accentColor: '#D9A7FF', backgroundColor: '#31245C', emoji: '🎵' },
  Mythology: { accentColor: '#FFB36B', backgroundColor: '#432B1E', emoji: '⚔️' },
  Nature: { accentColor: '#83E8C7', backgroundColor: '#183A35', emoji: '🌿' },
  Style: { accentColor: '#FF9CC9', backgroundColor: '#3B2033', emoji: '👟' },
  Travel: { accentColor: '#7FE3D5', backgroundColor: '#123E3B', emoji: '✈️' },
  TV: { accentColor: '#9CC5FF', backgroundColor: '#203051', emoji: '📺' },
};

export function templateToFeedPost(template: RankingTemplate): FeedPost {
  const visual = topicColors[template.topic] ?? { accentColor: '#C8FF64', backgroundColor: '#263020', emoji: '✨' };
  const shared = {
    id: `play-${template.id}`,
    templateId: template.id,
    creator: { id: 'rankfeed', displayName: 'Rankfeed', handle: '@rankfeed', avatarLabel: 'RF' },
    caption: template.description,
    topic: template.topic,
    title: template.title,
    engagement: { comments: 0, likes: 0, saves: 0, shares: 0 },
    visual,
  } as const;

  if (template.format === 'bracket') {
    return {
      ...shared,
      kind: 'bracket',
      matchup: [template.items[0] ?? 'First pick', template.items[1] ?? 'Second pick'],
      participants: template.items,
      roundLabel: 'Opening round',
    };
  }
  if (template.format === 'completed-result') {
    return {
      ...shared,
      kind: 'completed-result',
      resultItems: template.items.slice(0, 5).map((label, index) => ({ label, rank: index + 1 })),
    };
  }
  return {
    ...shared,
    kind: 'blind-ranking',
    currentItem: template.items[0] ?? 'First pick',
    items: template.items,
    progressLabel: 'Item 1 of 5',
    slotCount: Math.min(5, template.items.length),
  };
}
