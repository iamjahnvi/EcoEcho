import type { User } from '@supabase/supabase-js';

const requiredProfileFields = ['profile_username', 'full_name', 'profile_phone'] as const;

export function hasCompletedProfile(user: Pick<User, 'user_metadata'>) {
  const metadata = user.user_metadata ?? {};
  return metadata.profile_complete === true && requiredProfileFields.every((field) =>
    typeof metadata[field] === 'string' && metadata[field].trim().length > 0
  );
}

/** Identifies a newly created Supabase account so Google signup can show Welcome once. */
export function isNewSupabaseAccount(user: Pick<User, 'created_at' | 'last_sign_in_at'>) {
  if (!user.created_at || !user.last_sign_in_at) return false;
  const createdAt = Date.parse(user.created_at);
  const lastSignInAt = Date.parse(user.last_sign_in_at);
  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) return false;

  // Supabase timestamps are second-granularity; allow a short gap for initial token exchange.
  return lastSignInAt >= createdAt - 60_000 && lastSignInAt - createdAt <= 5 * 60_000;
}

export function getPostAuthPath(user: User, isNewAccount = false): '/welcome' | '/(tabs)' | '/(tabs)/profile' {
  if (hasCompletedProfile(user)) return '/(tabs)';
  if (isNewAccount && user.user_metadata?.profile_onboarding_started !== true) return '/welcome';
  return '/(tabs)/profile';
}
