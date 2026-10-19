import { useEffect, useState } from 'react';
import { Passkey } from 'react-native-passkey';
import { NativeModules } from 'react-native';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import {
  getAndroidPasskeyErrorMessage,
  registerAndroidPasskey,
  signInWithAndroidPasskey,
} from '@/lib/android-passkey-auth';
import { getSupabaseClient } from '@/lib/supabase';

type PasskeyActionsProps = {
  mode: 'both' | 'register';
};

export function PasskeyActions({ mode }: PasskeyActionsProps) {
  const [hasSession, setHasSession] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<'info' | 'error'>('error');
  const supportsAndroidPasskeys = Passkey.isSupported();
  const hasNativePasskeyModule = Boolean(NativeModules.Passkey);
  const isSupported = supportsAndroidPasskeys && hasNativePasskeyModule;

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    if (isSupported) {
      void Promise.resolve()
        .then(() => {
          if (!isMounted) return null;
          const supabase = getSupabaseClient();
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            setHasSession(Boolean(session?.user.id && !session.user.is_anonymous));
          });
          unsubscribe = () => subscription.unsubscribe();
          return supabase.auth.getSession();
        })
        .then((result) => {
          if (!isMounted || !result) return;
          if (result.error) {
            setNotice('Could not check your EcoEcho sign-in. Please try again.');
            return;
          }
          setHasSession(
            Boolean(result.data.session?.user.id && !result.data.session.user.is_anonymous)
          );
        })
        .catch(() => {
          if (isMounted) {
            setNotice('Could not initialize native passkey sign-in. Rebuild the Android app and try again.');
          }
        });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isSupported]);

  async function handleSignIn() {
    if (isWorking) return;
    setIsWorking(true);
    setNotice('');

    try {
      await signInWithAndroidPasskey(getSupabaseClient().auth, Passkey);
      setHasSession(true);
      setNotice('You are signed in to EcoEcho with a passkey.');
      setNoticeKind('info');
    } catch (error) {
      setNotice(getAndroidPasskeyErrorMessage(error, 'sign-in'));
      setNoticeKind('error');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRegistration() {
    if (isWorking) return;
    setIsWorking(true);
    setNotice('');

    try {
      await registerAndroidPasskey(getSupabaseClient().auth, Passkey);
      setNotice('Passkey registered. You can now use it to sign in to EcoEcho.');
      setNoticeKind('info');
    } catch (error) {
      setNotice(getAndroidPasskeyErrorMessage(error, 'registration'));
      setNoticeKind('error');
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <>
      {isSupported && mode === 'both' ? (
        <ActionButton
          label={isWorking ? 'PLEASE WAIT...' : 'Continue with a passkey'}
          variant="outlined"
          disabled={isWorking}
          onPress={() => void handleSignIn()}
        />
      ) : null}
      {isSupported && hasSession ? (
        <ActionButton
          label={isWorking ? 'PLEASE WAIT...' : 'Register a passkey'}
          variant="outlined"
          disabled={isWorking}
          onPress={() => void handleRegistration()}
        />
      ) : null}
      {!isSupported ? (
        <InlineNotice
          kind="error"
          message={
            !supportsAndroidPasskeys
              ? 'Native passkeys require Android 9 (API 28) or later. Use Google sign-in on this device.'
              : 'This APK does not include the native passkey module. Install a newly rebuilt Android development build to use passkeys.'
          }
        />
      ) : null}
      {notice ? <InlineNotice kind={noticeKind} message={notice} /> : null}
    </>
  );
}
