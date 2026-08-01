export type ActivityKind = 'follow' | 'like' | 'comment' | 'ranking-complete' | 'moderation';

export type ActivityNotification = {
  id: string;
  kind: ActivityKind;
  actor?: {
    id: string;
    displayName: string;
    handle: string;
    avatarLabel: string;
  };
  postId?: string;
  postTitle?: string;
  createdAt: string;
  readAt?: string;
};
