# RankFeed MVP definition

## Product promise

RankFeed lets people create, play, and discuss opinion-based rankings in a short-form social feed. Every post must contain a playable ranking or a completed result; passive creator video supports the ranking rather than replacing it.

## Initial audience

- General audience, age 13+
- English-language launch in the United States
- Entertainment rankings only; no anonymous direct messaging, dating, gambling, or ranking the attractiveness of real people

These are working launch assumptions and must be reviewed before store metadata is finalized.

## MVP ranking formats

1. Blind ranking: five candidates sampled from a larger pool and committed to fixed slots.
2. Bracket: two, four, or eight sampled candidates resolved to one champion.
3. Ordered list: a creator publishes up to ten items in a deliberate order.

## MVP account capabilities

- Browse a limited public feed without signing in
- Create an account with email, Apple, or Google
- Choose a unique handle and optional avatar/bio
- Create drafts and publish rankings
- Play rankings and retain completed results
- Follow or block creators
- Like, save, comment on, share, and report posts
- Delete comments, posts, and the entire account

## Explicitly out of MVP

- Direct messages
- Monetization, subscriptions, or paid creator content
- Live streaming
- Remix/duet video editing
- Private groups
- Machine-learned feed ranking
- Desktop creator studio

## Launch acceptance criteria

- All database tables exposed to clients have Row Level Security and tested policies.
- Account deletion removes the profile and owned user-generated content through a documented flow.
- Users can report posts/comments and block creators from every relevant surface.
- Feed pagination remains responsive with 10,000 seeded posts.
- Draft creation survives connectivity loss and can retry safely.
- Authentication, publishing, ranking completion, reporting, blocking, and deletion have end-to-end coverage.
- Crash-free sessions meet a 99.5% beta target before public rollout.
- Privacy policy, Terms, community guidelines, support contact, and deletion URL are live before store submission.
