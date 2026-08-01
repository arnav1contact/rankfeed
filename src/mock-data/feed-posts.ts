import type { FeedPost } from '@/src/features/feed/types';

import { mockCompletedRankings } from './completed-rankings';
import { mockCreators } from './creators';
import { mockRankingTemplates } from './ranking-templates';

const iceCream = mockRankingTemplates[0];
const fries = mockRankingTemplates[1];
const albums = mockRankingTemplates[2];
const travel = mockRankingTemplates[3];
const weapons = mockRankingTemplates[4];
const sitcoms = mockRankingTemplates[5];
const snacks = mockRankingTemplates[6];

export const mockFeedPosts = [
  {
    id: 'post-ice-cream-01', templateId: iceCream.id, kind: 'blind-ranking', creator: mockCreators.maya,
    caption: 'I already regret where I put cookie dough. Your turn.', topic: 'Food · Blind ranking', title: iceCream.title,
    currentItem: iceCream.items[0], items: iceCream.items, progressLabel: 'Item 1 of 5', slotCount: 5,
    engagement: { likes: 18400, comments: 932, saves: 2100, shares: 764 },
    visual: { backgroundColor: '#31245C', accentColor: '#A8F0C6', emoji: '🍦' },
  },
  {
    id: 'post-weapons-01', templateId: weapons.id, kind: 'bracket', creator: mockCreators.eli,
    caption: 'No lore debates. Pick the weapon you would actually carry.', topic: 'Mythology · Bracket', title: weapons.title,
    matchup: [weapons.items[0], weapons.items[1]], participants: weapons.items, roundLabel: 'Quarterfinal · Match 1 of 4',
    engagement: { likes: 32700, comments: 4100, saves: 6800, shares: 2300 },
    visual: { backgroundColor: '#3A1D22', accentColor: '#FFCB6B', emoji: '⚔️' },
  },
  {
    id: 'post-pokemon-01', templateId: mockCompletedRankings[0].templateId, kind: 'completed-result', creator: mockCreators.nina,
    caption: 'The top two were easy. Everything after that hurt.', topic: 'Gaming · Completed ranking', title: mockCompletedRankings[0].title,
    resultItems: mockCompletedRankings[0].items, engagement: { likes: 24100, comments: 3500, saves: 1900, shares: 1100 },
    visual: { backgroundColor: '#123E3B', accentColor: '#7FE3D5', emoji: '🎮' },
  },
  {
    id: 'post-fries-01', templateId: fries.id, kind: 'blind-ranking', creator: mockCreators.dev,
    caption: 'The seasoned fry question changed everything.', topic: 'Food · Blind ranking', title: fries.title,
    currentItem: fries.items[0], items: fries.items, progressLabel: 'Item 1 of 5', slotCount: 5,
    engagement: { likes: 46300, comments: 5200, saves: 8100, shares: 3400 },
    visual: { backgroundColor: '#4A2718', accentColor: '#FFD166', emoji: '🍟' },
  },
  {
    id: 'post-sitcom-01', templateId: sitcoms.id, kind: 'bracket', creator: mockCreators.theo,
    caption: 'Your rewatch history is the only evidence that counts.', topic: 'TV · Bracket', title: sitcoms.title,
    matchup: [sitcoms.items[0], sitcoms.items[1]], participants: sitcoms.items, roundLabel: 'Quarterfinal · Match 1 of 4',
    engagement: { likes: 29800, comments: 6700, saves: 4200, shares: 1900 },
    visual: { backgroundColor: '#203051', accentColor: '#9CC5FF', emoji: '📺' },
  },
  {
    id: 'post-breakfast-01', templateId: mockCompletedRankings[1].templateId, kind: 'completed-result', creator: mockCreators.dev,
    caption: 'Breakfast burrito believers, we won.', topic: 'Food · Completed ranking', title: mockCompletedRankings[1].title,
    resultItems: mockCompletedRankings[1].items, engagement: { likes: 15700, comments: 1200, saves: 3600, shares: 842 },
    visual: { backgroundColor: '#46351C', accentColor: '#FFE29A', emoji: '🍳' },
  },
  {
    id: 'post-albums-01', templateId: albums.id, kind: 'blind-ranking', creator: mockCreators.jordan,
    caption: 'There is absolutely no safe first slot here.', topic: 'Music · Blind ranking', title: albums.title,
    currentItem: albums.items[0], items: albums.items, progressLabel: 'Item 1 of 5', slotCount: 5,
    engagement: { likes: 38100, comments: 8900, saves: 7200, shares: 4600 },
    visual: { backgroundColor: '#321F45', accentColor: '#E7A8FF', emoji: '💿' },
  },
  {
    id: 'post-movies-01', templateId: mockCompletedRankings[2].templateId, kind: 'completed-result', creator: mockCreators.sofia,
    caption: 'Animation is cinema. Here is my evidence.', topic: 'Movies · Completed ranking', title: mockCompletedRankings[2].title,
    resultItems: mockCompletedRankings[2].items, engagement: { likes: 52600, comments: 7700, saves: 9400, shares: 5100 },
    visual: { backgroundColor: '#173A47', accentColor: '#82E9F7', emoji: '🎬' },
  },
  {
    id: 'post-snacks-01', templateId: snacks.id, kind: 'bracket', creator: mockCreators.maya,
    caption: 'The winner gets the big bowl during the movie.', topic: 'Food · Bracket', title: snacks.title,
    matchup: [snacks.items[0], snacks.items[1]], participants: snacks.items, roundLabel: 'Quarterfinal · Match 1 of 4',
    engagement: { likes: 21300, comments: 2900, saves: 3100, shares: 1200 },
    visual: { backgroundColor: '#432B1E', accentColor: '#FFB36B', emoji: '🍿' },
  },
  {
    id: 'post-travel-01', templateId: travel.id, kind: 'blind-ranking', creator: mockCreators.avery,
    caption: 'I need all five weekends and a much larger budget.', topic: 'Travel · Blind ranking', title: travel.title,
    currentItem: travel.items[0], items: travel.items, progressLabel: 'Item 1 of 5', slotCount: 5,
    engagement: { likes: 17200, comments: 980, saves: 5900, shares: 2100 },
    visual: { backgroundColor: '#16353A', accentColor: '#76E6CD', emoji: '✈️' },
  },
  {
    id: 'post-album-results-01', templateId: mockCompletedRankings[3].templateId, kind: 'completed-result', creator: mockCreators.jordan,
    caption: 'Ask me again tomorrow and the order may change.', topic: 'Music · Completed ranking', title: mockCompletedRankings[3].title,
    resultItems: mockCompletedRankings[3].items, engagement: { likes: 27600, comments: 4100, saves: 6200, shares: 2900 },
    visual: { backgroundColor: '#362143', accentColor: '#D9A7FF', emoji: '🎵' },
  },
  {
    id: 'post-city-results-01', templateId: mockCompletedRankings[4].templateId, kind: 'completed-result', creator: mockCreators.avery,
    caption: 'A perfect long weekend has great food and no itinerary.', topic: 'Travel · Completed ranking', title: mockCompletedRankings[4].title,
    resultItems: mockCompletedRankings[4].items, engagement: { likes: 13900, comments: 720, saves: 4400, shares: 1600 },
    visual: { backgroundColor: '#183A35', accentColor: '#83E8C7', emoji: '🌍' },
  },
] as const satisfies readonly FeedPost[];
