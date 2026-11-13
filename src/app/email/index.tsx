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

export default function EmailSignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.setItem('email', email).catch(() => {});
  }, [email]);

  const supabase = getSupabaseClient();

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOtp = async () => {
    if (!email || !validateEmail(email)) {
      setNotice('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setNotice('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: process.env.EXPO_PUBLIC_SUPABASE_URL,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setNotice(error.message || 'Failed to send verification code.');
        return;
      }

      setNotice('Verification code sent to your email address. Please check your inbox.');

      // Start resend cooldown at 30 seconds
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

      // Navigate to OTP verification screen with email
      router.push('/email/otp');
    } catch (err: any) {
      setNotice(err.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !validateEmail(email)) return;

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

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Welcome back</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Sign in with your email
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            autoComplete="email"
          />
          {email && !validateEmail(email) && (
            <Text style={styles.errorText}>Please enter a valid email address.</Text>
          )}
        </View>

        {isLoading ? (
          <InlineNotice kind="info" message="Sending verification code..." />
        ) : (
          <View>
            <ActionButton
              label={resendCooldown !== null ? `Resend in ${resendCooldown}s` : 'Send verification code'}
              disabled={isLoading || resendCooldown !== null}
              onPress={handleSendOtp}
            />
            {notice ? (
              <InlineNotice kind="error" message={notice} />
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
    height: 52,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
    borderRadius: 17,
    paddingHorizontal: 18,
    fontSize: 16,
    color: OnboardingColors.forest,
    backgroundColor: OnboardingColors.white,
    marginBottom: 16,
  },
  errorText: {
    color: OnboardingColors.error,
    fontSize: 12,
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