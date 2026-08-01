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
