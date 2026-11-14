import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { useAuthSession } from '@/contexts/auth-session-context';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const { refreshSession } = useAuthSession();
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
    const navigateOnce = () => {
      if (!isMounted || didNavigate.current) return;
      didNavigate.current = true;

      // Defer navigation until Supabase's auth-state callback has returned.
      navigationTimer = setTimeout(() => {
        void (async () => {
          try {
            if (!isMounted) return;
            const activeSession = await refreshSession();
            if (!activeSession) throw new Error('No active Supabase session.');
            router.replace('/(tabs)');
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
        navigateOnce();
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

        navigateOnce();
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
  }, [oauthError, refreshSession]);

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
