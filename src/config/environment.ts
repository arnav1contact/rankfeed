export type BackendEnvironment = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

export const backendEnvironment: BackendEnvironment = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || undefined,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || undefined,
};

export const isBackendConfigured = Boolean(
  backendEnvironment.supabaseUrl && backendEnvironment.supabasePublishableKey,
);
