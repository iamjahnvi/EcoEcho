import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase';
import { getPostAuthPath } from '@/lib/onboarding';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const { error: oauthError } = useLocalSearchParams<{ error?: string }>();
  const [notice, setNotice] = useState(
    oauthError ? 'Google sign-in was cancelled or could not be completed.' : ''
  );
  const [isComplete, setIsComplete] = useState(false);
  const didNavigate = useRef(false);

  useEffect(() => {
    if (oauthError) return;

    let isMounted = true;
    let navigationTimer: ReturnType<typeof setTimeout> | undefined;
    const supabase = getSupabaseClient();
    const navigateOnce = (session: Session) => {
      if (!isMounted || didNavigate.current) return;
      didNavigate.current = true;

      // Defer navigation until Supabase's auth-state callback has returned.
      navigationTimer = setTimeout(() => {
        void (async () => {
          try {
            if (!isMounted) return;
            const user = session.user;
            const destination = user.app_metadata?.provider === 'google'
              ? '/(tabs)'
              : getPostAuthPath(user);
            router.replace(destination);
          } catch {
            if (!isMounted) return;
            didNavigate.current = false;
            setNotice('Google sign-in could not be completed. Please try again.');
            setIsComplete(true);
          }
        })();
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) {
        navigateOnce(session);
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error || !data.session?.user.id) {
          setNotice('Google sign-in could not be completed. Please try again.');
          setIsComplete(true);
          return;
        }

        navigateOnce(data.session);
      })
      .catch(() => {
        if (!isMounted) return;
        setNotice('Google sign-in could not be completed. Please try again.');
        setIsComplete(true);
      });

    return () => {
      isMounted = false;
      if (navigationTimer) clearTimeout(navigationTimer);
      subscription.unsubscribe();
    };
  }, [oauthError]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>Google sign-in</Text>
        {notice ? (
          <InlineNotice kind={isComplete || oauthError ? 'error' : 'info'} message={notice} />
        ) : (
          <Text style={[styles.status, { color: theme.textSecondary }]}>
            Completing your EcoEcho sign-in…
          </Text>
        )}
        {isComplete || oauthError ? (
          <ActionButton label="Return to EcoEcho" onPress={() => router.replace('/')} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  status: {
    fontSize: 15,
    textAlign: 'center',
  },
});
