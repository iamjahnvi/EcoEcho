import { useEffect, useState } from 'react';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { getSupabaseClient } from '@/lib/supabase';

type PasskeyActionsProps = {
  mode: 'both' | 'register';
};

export function PasskeyActions({ mode }: PasskeyActionsProps) {
  const [hasSession, setHasSession] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session?.user.id && !session.user.is_anonymous));
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setNotice('Could not check your EcoEcho sign-in. Please try again.');
        return;
      }
      setHasSession(Boolean(data.session?.user.id && !data.session.user.is_anonymous));
    }).catch(() => {
      if (isMounted) setNotice('Could not check your EcoEcho sign-in. Please try again.');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function explainNativeSetup() {
    setNotice(
      mode === 'register'
        ? 'Native passkey registration is not configured in this Android build yet. Use Google or phone OTP for now.'
        : 'Native passkey sign-in is not configured in this Android build yet. Use Google or phone OTP for now.'
    );
  }

  return (
    <>
      {mode === 'both' ? (
        <ActionButton
          label="Continue with a passkey"
          variant="outlined"
          onPress={explainNativeSetup}
        />
      ) : hasSession ? (
        <ActionButton
          label="Register a passkey"
          variant="outlined"
          onPress={explainNativeSetup}
        />
      ) : null}
      {notice ? <InlineNotice kind="error" message={notice} /> : null}
    </>
  );
}
