import type { FeedPost } from '@/src/features/feed/types';

import { mockCreators } from './creators';
import { mockRankingTemplates } from './ranking-templates';
import type { RankingTemplate } from './types';

const creators = Object.values(mockCreators);
const palettes = [
  { backgroundColor: '#31245C', accentColor: '#A8F0C6' },
  { backgroundColor: '#3A1D22', accentColor: '#FFCB6B' },
  { backgroundColor: '#123E3B', accentColor: '#7FE3D5' },
  { backgroundColor: '#203051', accentColor: '#9CC5FF' },
  { backgroundColor: '#432B1E', accentColor: '#FFB36B' },
  { backgroundColor: '#362143', accentColor: '#D9A7FF' },
  { backgroundColor: '#183A35', accentColor: '#83E8C7' },
  { backgroundColor: '#3B2033', accentColor: '#FF9CC9' },
] as const;

const topicEmoji: Record<string, string> = {
  Culture: '⚡', Food: '🍽️', Games: '🎲', Gaming: '🎮', Movies: '🎬', Music: '🎵',
  Mythology: '⚔️', Nature: '🌿', Style: '👟', Travel: '✈️', TV: '📺',
};

const captions = {
  'blind-ranking': [
    'No take-backs. The next reveal could ruin everything.',
    'I was confident until item three showed up.',
    'Try this without saving the obvious top slot.',
  ],
  bracket: [
    'One matchup at a time. Defend your champion below.',
    'This bracket gets painful much earlier than expected.',
    'No ties allowed. Pick the one that advances.',
  ],
  'completed-result': [
    'My final order is locked. Which pick would you change?',
    'The top two were easy. The rest took forever.',
    'This is the list I am willing to defend today.',
  ],
} as const;

function createFeedPost(template: RankingTemplate, templateIndex: number, variant: number): FeedPost {
  const creator = creators[(templateIndex * 2 + variant) % creators.length];
  const palette = palettes[(templateIndex + variant * 3) % palettes.length];
  const engagementBase = 7100 + ((templateIndex * 7919 + variant * 3701) % 46000);
  const shared = {
    id: `post-${template.id.replace('template-', '')}-${variant + 1}`,
    templateId: template.id,
    creator,
    caption: captions[template.format][(templateIndex + variant) % captions[template.format].length],
    topic: `${template.topic} · ${template.format === 'blind-ranking' ? 'Blind ranking' : template.format === 'bracket' ? 'Bracket' : 'Completed ranking'}`,
    title: template.title,
    engagement: {
      likes: engagementBase,
      comments: Math.round(engagementBase * 0.084),
      saves: Math.round(engagementBase * 0.13),
      shares: Math.round(engagementBase * 0.052),
    },
    visual: { ...palette, emoji: topicEmoji[template.topic] ?? '✨' },
  };

  if (template.format === 'blind-ranking') {
    return {
      ...shared,
      kind: 'blind-ranking',
      currentItem: template.items[0] ?? 'Mystery item',
      items: template.items,
      progressLabel: 'Item 1 of 5',
      slotCount: 5,
    };
  }

  if (template.format === 'bracket') {
    return {
      ...shared,
      kind: 'bracket',
      matchup: [template.items[0] ?? 'Option one', template.items[1] ?? 'Option two'],
      participants: template.items,
      roundLabel: 'Quarterfinal · Match 1 of 4',
    };
  }

  const offset = variant * 5;
  const resultItems = template.items.slice(offset, offset + 5);
  return {
    ...shared,
    kind: 'completed-result',
    resultItems: resultItems.map((label, index) => ({ label, rank: index + 1 })),
  };
}

export const mockFeedPosts: readonly FeedPost[] = mockRankingTemplates.flatMap((template, index) => [
  createFeedPost(template, index, 0),
  createFeedPost(template, index, 1),
]);
