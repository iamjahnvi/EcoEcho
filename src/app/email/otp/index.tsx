import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { GoogleSignInAction } from '@/components/google-sign-in-action';
import { OnboardingColors } from '@/components/onboarding-ui';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('email').then((e) => setEmail(e || '')).catch(() => setEmail(''));
  }, []);

  const supabase = getSupabaseClient();

  const handleVerifyOtp = async () => {
    if (!code || code.length !== 6) {
      setNotice('Please enter a 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setNotice('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        type: 'email',
        token: code,
        email,
      });

      if (error) {
        setNotice(error.message || 'Invalid or expired verification code.');
        return;
      }

      // Sign-in successful, navigate to home
      router.replace('/');
    } catch (err: any) {
      setNotice(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsLoading(true);
    setNotice('');

    try {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: process.env.EXPO_PUBLIC_SUPABASE_URL,
          shouldCreateUser: true,
        },
      });

      setNotice('Verification code sent again.');

      let seconds = 30;
      setResendCooldown(seconds);
      const interval = setInterval(() => {
        seconds--;
        setResendCooldown(seconds);
        if (seconds <= 0) {
          clearInterval(interval);
          setResendCooldown(null);
        }
      }, 1000);
    } catch (err: any) {
      setNotice(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (notice) {
      const timeoutId = setTimeout(() => setNotice(''), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [notice]);

  const noticeKind = notice ? 'error' : 'info';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Verify your code</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            A verification code has been sent to {email}. Please enter the 6-digit code.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Verification code</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setCode(text)}
            keyboardType="number-pad"
            returnKeyType="done"
            autoCapitalize="none"
            value={code}
            placeholder="123456"
            maxLength={6}
          />
          {code.length > 0 && code.length < 6 && (
            <Text style={styles.partialText}>
              Only {code.length} digit{'s'}{' '}entered. Code is not submitted until 6 digits are entered.
            </Text>
          )}
        </View>

        {isLoading ? (
          <InlineNotice kind="info" message="Verifying code..." />
        ) : (
          <View>
            <ActionButton
              label={resendCooldown !== null ? `Resend in ${resendCooldown}s` : 'Verify code'}
              disabled={isLoading || resendCooldown !== null || code.length < 6}
              onPress={resendCooldown != null ? handleResend : handleVerifyOtp}
            />
            {notice ? (
              <InlineNotice kind={noticeKind} message={notice} />
            ) : null}
          </View>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInAction onNotice={setNotice} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '800',
    color: OnboardingColors.forest,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: OnboardingColors.muted,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: OnboardingColors.forest,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: OnboardingColors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '700',
    color: OnboardingColors.forest,
    textAlign: 'center',
    backgroundColor: OnboardingColors.white,
    marginBottom: 20,
    marginTop: 8,
  },
  partialText: {
    color: OnboardingColors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  button: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: OnboardingColors.border,
  },
  dividerText: {
    color: OnboardingColors.muted,
    fontSize: 11,
    marginHorizontal: 8,
    textTransform: 'uppercase',
  },
});