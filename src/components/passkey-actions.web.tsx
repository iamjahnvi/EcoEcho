import { useEffect, useState } from 'react';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { getSupabaseClient } from '@/lib/supabase';

type PasskeyActionsProps = {
  mode: 'both' | 'register';
};

type PasskeyErrorProperties = {
  code?: unknown;
  name?: unknown;
  message?: unknown;
};

function hasWebAuthnSupport() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

function isCancellation(error: unknown) {
  if (typeof error !== 'object' || error === null) return false;

  const properties = error as PasskeyErrorProperties;
  return (
    properties.code === 'ERROR_CEREMONY_ABORTED' ||
    properties.name === 'NotAllowedError' ||
    properties.name === 'AbortError'
  );
}

function getFailureMessage(error: unknown, operation: 'sign-in' | 'registration') {
  if (isCancellation(error)) {
    return `Passkey ${operation} was cancelled or timed out. Try again or use another sign-in method.`;
  }

  return operation === 'sign-in'
    ? 'Passkey sign-in could not be completed. Try again or use Google sign-in.'
    : 'Passkey registration could not be completed. Try again or use another sign-in method.';
}

function hasSignedInUser(session: { user: { id: string; is_anonymous?: boolean } } | null) {
  return Boolean(session?.user.id && !session.user.is_anonymous);
}

export function PasskeyActions({ mode }: PasskeyActionsProps) {
  const [hasSession, setHasSession] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<'info' | 'error'>('info');

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve().then(() => {
      if (!isMounted) return;

      try {
        const supabase = getSupabaseClient();
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setHasSession(hasSignedInUser(session));
        });
        unsubscribe = () => subscription.unsubscribe();

        void supabase.auth
          .getSession()
          .then(({ data, error }) => {
            if (!isMounted) return;

            if (error) {
              setNotice('Could not check your EcoEcho sign-in. Please try again.');
              setNoticeKind('error');
              return;
            }

            setHasSession(hasSignedInUser(data.session));
          })
          .catch(() => {
            if (!isMounted) return;
            setNotice('Could not check your EcoEcho sign-in. Please try again.');
            setNoticeKind('error');
          });
      } catch {
        if (!isMounted) return;
        setNotice('Passkey sign-in is temporarily unavailable. Please try another sign-in method.');
        setNoticeKind('error');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  async function handleSignIn() {
    if (isWorking) return;
    if (!hasWebAuthnSupport()) {
      setNotice(
        'Passkeys require a supported browser on a secure connection. Use HTTPS or localhost, or choose another sign-in method.'
      );
      setNoticeKind('error');
      return;
    }

    setIsWorking(true);
    setNotice('');

    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPasskey();
      if (error) {
        setNotice(getFailureMessage(error, 'sign-in'));
        setNoticeKind('error');
        return;
      }

      if (!data?.session || !data.user) {
        setNotice('Supabase did not confirm passkey sign-in. Please try again.');
        setNoticeKind('error');
        return;
      }

      setHasSession(true);
      setNotice('You are signed in to EcoEcho with your passkey.');
      setNoticeKind('info');
    } catch (error) {
      setNotice(getFailureMessage(error, 'sign-in'));
      setNoticeKind('error');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRegistration() {
    if (isWorking) return;
    if (!hasWebAuthnSupport()) {
      setNotice(
        'Passkey registration requires a supported browser on a secure connection. Use HTTPS or localhost.'
      );
      setNoticeKind('error');
      return;
    }

    setIsWorking(true);
    setNotice('');

    try {
      const supabase = getSupabaseClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setNotice('Could not verify your EcoEcho sign-in. Please sign in again and retry.');
        setNoticeKind('error');
        return;
      }
      if (!hasSignedInUser(sessionData.session)) {
        setHasSession(false);
        setNotice('Sign in with Google before registering a passkey.');
        setNoticeKind('error');
        return;
      }

      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        setNotice(getFailureMessage(error, 'registration'));
        setNoticeKind('error');
        return;
      }
      if (!data?.id) {
        setNotice('Supabase did not confirm passkey registration. Please try again.');
        setNoticeKind('error');
        return;
      }

      setNotice('Passkey registered. You can now use it to sign in to EcoEcho.');
      setNoticeKind('info');
    } catch (error) {
      setNotice(getFailureMessage(error, 'registration'));
      setNoticeKind('error');
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <>
      {mode === 'both' ? (
        <ActionButton
          label={isWorking ? 'PLEASE WAIT...' : 'Continue with a passkey'}
          variant="outlined"
          disabled={isWorking}
          onPress={() => void handleSignIn()}
        />
      ) : null}
      {hasSession ? (
        <ActionButton
          label={isWorking ? 'PLEASE WAIT...' : 'Register a passkey'}
          variant="outlined"
          disabled={isWorking}
          onPress={() => void handleRegistration()}
        />
      ) : null}
      {notice ? <InlineNotice kind={noticeKind} message={notice} /> : null}
    </>
  );
}
