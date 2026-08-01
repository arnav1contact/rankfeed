import type { Creator } from '@/src/features/feed/types';

export const mockCreators = {
  maya: { id: 'creator-maya', displayName: 'Maya Chen', handle: '@mayapicks', avatarLabel: 'MC' },
  eli: { id: 'creator-eli', displayName: 'Eli Torres', handle: '@mythmatchups', avatarLabel: 'ET' },
  nina: { id: 'creator-nina', displayName: 'Nina Brooks', handle: '@ninaplays', avatarLabel: 'NB' },
  dev: { id: 'creator-dev', displayName: 'Dev Patel', handle: '@devoured', avatarLabel: 'DP' },
  sofia: { id: 'creator-sofia', displayName: 'Sofia Reyes', handle: '@sofiasees', avatarLabel: 'SR' },
  jordan: { id: 'creator-jordan', displayName: 'Jordan Kim', handle: '@soundtakes', avatarLabel: 'JK' },
  avery: { id: 'creator-avery', displayName: 'Avery Brooks', handle: '@averyoutside', avatarLabel: 'AB' },
  theo: { id: 'creator-theo', displayName: 'Theo Grant', handle: '@rewatchtheo', avatarLabel: 'TG' },
} as const satisfies Record<string, Creator>;
