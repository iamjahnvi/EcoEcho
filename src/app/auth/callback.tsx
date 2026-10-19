import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const { error: oauthError } = useLocalSearchParams<{ error?: string }>();
  const [notice, setNotice] = useState(
    oauthError ? 'Google sign-in was cancelled or could not be completed.' : ''
  );
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (oauthError) return;

    let isMounted = true;
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) {
        router.replace('/');
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

        router.replace('/');
      })
      .catch(() => {
        if (!isMounted) return;
        setNotice('Google sign-in could not be completed. Please try again.');
        setIsComplete(true);
      });

    return () => {
      isMounted = false;
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
