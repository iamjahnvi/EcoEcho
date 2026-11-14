import type { User } from '@supabase/supabase-js';

const requiredProfileFields = ['profile_username', 'full_name', 'profile_phone'] as const;

export function hasCompletedProfile(user: Pick<User, 'user_metadata'>) {
  const metadata = user.user_metadata ?? {};
  return metadata.profile_complete === true && requiredProfileFields.every((field) =>
    typeof metadata[field] === 'string' && metadata[field].trim().length > 0
  );
}
