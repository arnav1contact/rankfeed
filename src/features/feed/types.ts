type Creator = {
  id: string;
  displayName: string;
  handle: string;
  avatarLabel: string;
};

type Engagement = {
  likes: number;
  comments: number;
  saves: number;
  shares: number;
};

type PostVisual = {
  backgroundColor: string;
  accentColor: string;
  emoji: string;
};

type BaseFeedPost = {
  id: string;
  templateId: string;
  creator: Creator;
  caption: string;
  topic: string;
  title: string;
  engagement: Engagement;
  visual: PostVisual;
};

export type BlindRankingFeedPost = BaseFeedPost & {
  kind: 'blind-ranking';
  currentItem: string;
  progressLabel: string;
  slotCount: number;
};

export type BracketFeedPost = BaseFeedPost & {
  kind: 'bracket';
  matchup: readonly [string, string];
  roundLabel: string;
};

export type CompletedResultFeedPost = BaseFeedPost & {
  kind: 'completed-result';
  resultItems: readonly {
    rank: number;
    label: string;
  }[];
};

export type FeedPost =
  | BlindRankingFeedPost
  | BracketFeedPost
  | CompletedResultFeedPost;
