import { mockCreators } from './creators';
import { mockRankingTemplates } from './ranking-templates';
import type { CompletedRanking } from './types';

const creatorIds = Object.values(mockCreators).map((creator) => creator.id);
const completedTemplates = mockRankingTemplates.filter((template) => template.format === 'completed-result');

export const mockCompletedRankings: readonly CompletedRanking[] = completedTemplates.flatMap((template, templateIndex) =>
  [0, 1].map((variant) => {
    const offset = variant * 5;
    const selectedItems = template.items.slice(offset, offset + 5);
    return {
      id: `result-${template.id.replace('template-', '')}-${variant + 1}`,
      creatorId: creatorIds[(templateIndex * 2 + variant) % creatorIds.length],
      templateId: template.id,
      title: template.title,
      topic: template.topic,
      items: selectedItems.map((label, index) => ({ label, rank: index + 1 })),
    };
  }),
);
