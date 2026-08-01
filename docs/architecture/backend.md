# Backend architecture

## Environments

Use three isolated Supabase projects:

| Environment | Purpose | Data policy |
| --- | --- | --- |
| Development | Local engineering and seeded fixtures | Disposable |
| Staging | QA, TestFlight, and Play closed testing | Synthetic test accounts only |
| Production | Public application | Backups, retention, and audited access |

Project ownership, organization, billing, deployment region, and production identifiers must be confirmed before provisioning hosted resources.

## Client boundary

Screens consume repository interfaces from `src/data/repositories.ts`. During migration, the existing local store remains the fallback implementation. Supabase implementations use the `src/data/supabase-*.ts` naming convention and translate database rows into domain models.

The application only receives a Supabase publishable key. Service-role keys and moderation automation belong exclusively in trusted server or Edge Function environments.

## Core data flow

1. Authentication creates an `auth.users` record.
2. A database trigger creates the corresponding public profile.
3. Creators build draft templates/posts and ordered item records.
4. Publishing changes visibility atomically after validation.
5. Players create private ranking sessions and placements.
6. Social mutations use unique constraints for idempotency.
7. Reports are write-only for ordinary users and visible only to the moderation service.

## Security rules

- Row Level Security is enabled on every public table.
- Ownership checks use `auth.uid()`; client-provided owner IDs are never trusted by server workflows.
- Saves, ranking sessions, blocks, and reports are private to their owner.
- Drafts are only visible to their creator.
- Public comments and posts exclude soft-deleted records.
- Block filtering is enforced in feed repository queries and will move to a database function before launch.
- Video upload policies and moderation status are added before media upload ships.

## Account lifecycle

- The auth trigger creates a matching public profile for each new account.
- Profile edits go through the RLS-protected `profiles` table.
- Permanent deletion is handled by the authenticated `delete-account` Edge Function. The client never receives an admin or secret key.
- Deleting `auth.users` cascades through the profile, authored posts, comments, follows, likes, saves, ranking sessions, reports, and notifications.
- Deploy the function with JWT verification enabled: `supabase functions deploy delete-account`.

## Migration workflow

1. Develop migrations locally under `supabase/migrations/`.
2. Reset and seed the local database.
3. Generate `src/data/database.types.ts` from the local schema.
4. Run repository integration tests against local Supabase.
5. Deploy authenticated Edge Functions to staging and exercise account deletion with a disposable test user.
6. Apply migrations to staging, validate, then promote the same immutable migration and functions to production.
