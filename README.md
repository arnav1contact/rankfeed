# RankFeed prototype

A mobile-first social app for creating, discovering, and playing interactive rankings. The current prototype is local-first and includes:

- A five-tab Reels-style layout with Rankings as the default tab
- Full-screen vertical paging across typed mock ranking posts
- Interactive blind-ranking slots and bracket choices
- A Create flow that publishes new rankings into the live session feed
- Search and category filtering in Explore
- Home activity and session-aware Profile views

Creator video space is deliberately reserved behind the ranking overlays for a future media integration. Newly created rankings currently persist for the active app session only.

## Requirements

- Node.js 20.19.4 or newer (`.nvmrc` pins the minimum development version)
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
