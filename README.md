# RankFeed prototype

A mobile-first social app for creating, discovering, and playing interactive rankings. The current prototype is local-first and includes:

- A five-tab Reels-style layout with Rankings as the default tab
- Full-screen vertical paging across typed mock ranking posts
- Stable cursor-based infinite loading for signed-in Supabase feeds
- Separate For You and Following feeds with independent pagination
- Interactive blind-ranking slots and bracket choices with durable result history
- A Create flow that publishes new rankings into the live session feed
- Automatic offline draft saving with resume and discard controls
- One-tap publishing from a completed game into Finished Lists
- Feed-level reporting and creator blocking with Profile unblock controls
- Creator post management and owner-only comment deletion
- Search and category filtering in Explore
- Home activity and session-aware Profile views
- Passwordless email, Google, and Apple account entry points

Creator video space is deliberately reserved behind the ranking overlays for a future media integration. Created rankings, completed plays, likes, saves, follows, and comments persist locally across app restarts. Signed-in ranking sessions and published results sync through Supabase when the backend is configured.

## Mock data

All display fixtures live in `src/mock-data/` and are separated by purpose:

- `creators.ts` — reusable creator profiles
- `item-pools.ts` — 15–18 candidates per topic for randomized draws
- `ranking-templates.ts` — 24 playable blind-ranking, bracket, and top-list templates
- `completed-rankings.ts` — 16 published creator results
- `feed-posts.ts` — the mixed social feed assembled from those records

`index.ts` is the public entry point for app features that consume mock data.

The mock catalog currently generates 48 feed posts and 16 completed results across 12 creators. Blind rankings sample five random candidates from their larger pools on each play, brackets sample a fresh tournament field, and the feed reshuffles whenever Rankings regains focus.

## Requirements

- Node.js 22 or newer (`.nvmrc` pins the development version)
- npm
- Expo Go on an iPhone for the initial prototype

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Expo:

   ```bash
   npm start
   ```

3. Scan the QR code with Expo Go. The computer and iPhone should be on the same network.

If local-network discovery is unavailable, try:

```bash
npx expo start --tunnel
```

## Validate

```bash
npm run check
```

Create a production web bundle with:

```bash
npx expo export --platform web
```

The app name is temporary and centralized in `src/config/app.ts`.

## Backend foundation

The production data boundary is scaffolded for Supabase while the app continues to use its local repository during development.

- Copy `.env.example` to `.env` after a hosted Supabase development project exists.
- Database migrations and local configuration live in `supabase/`.
- Product scope is documented in `docs/product/mvp.md`.
- Backend decisions and environment promotion are documented in `docs/architecture/backend.md`.
- Client features depend on repository contracts in `src/data/repositories.ts`.

The hosted organization, projects, region, billing, and permanent bundle identifiers still need owner approval before provisioning.
