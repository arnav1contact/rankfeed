# Supabase development

This directory contains the backend schema and local development configuration. No hosted project is linked yet.

After installing the Supabase CLI and Docker:

```bash
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/data/database.types.ts
```

Use `.env.example` to configure the Expo client. Never place a service-role or secret key in an `EXPO_PUBLIC_` variable.

Before linking a hosted project, confirm the Supabase organization, owner, billing plan, deployment region, and separate development/staging/production project names.

The activity inbox depends on the notification triggers in `20260801120000_activity_notifications.sql`; apply migrations before testing signed-in activity.

## Social authentication

Google and Apple sign-in use Supabase OAuth with Expo's system authentication session. Before testing them in a hosted project:

1. Enable Google and Apple under Supabase Authentication > Providers and add the provider credentials there.
2. Add `rankfeed://auth/callback` to the Supabase redirect URL allow list.
3. Add each deployed web callback, such as `https://app.example.com/auth/callback`, plus the local callback used by Expo web development.
4. Configure the callback URL shown by Supabase in the Google and Apple provider consoles. Provider secrets must never use an `EXPO_PUBLIC_` variable.
