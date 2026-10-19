import { useState } from 'react';

import { ActionButton } from '@/components/onboarding-ui';
import { getSupabaseClient } from '@/lib/supabase';

type GoogleSignInActionProps = {
  onNotice: (message: string) => void;
};

export function GoogleSignInAction({ onNotice }: GoogleSignInActionProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn() {
    if (isSigningIn) return;

    setIsSigningIn(true);
    onNotice('');

    try {
      const redirectTo = new URL('/auth/callback', window.location.origin).toString();
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) {
        onNotice('Google sign-in could not be started. Please try again.');
        setIsSigningIn(false);
      }
    } catch {
      onNotice('Google sign-in is unavailable right now. Please try again.');
      setIsSigningIn(false);
    }
  }

  return (
    <ActionButton
      label={isSigningIn ? 'CONNECTING...' : 'Continue with Google'}
      variant="outlined"
      disabled={isSigningIn}
      onPress={() => void handleSignIn()}
    />
  );
}
