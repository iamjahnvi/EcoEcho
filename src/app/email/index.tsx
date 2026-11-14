import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, Pressable, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as AsyncStorage from '@react-native-async-storage/async-storage';

import { ActionButton, InlineNotice } from '@/components/onboarding-ui';
import { OnboardingColors } from '@/components/onboarding-ui';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase';
import { GoogleSignInAction } from '@/components/google-sign-in-action';

export default function EmailAuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [tab, setTab] = useState<'sign-up' | 'log-in'>('sign-up');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const supabase = getSupabaseClient();

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters.' };
    }
    // Supabase default password requirements - check for basic strength
    if (password.length < 8) {
      return { valid: true, message: 'Password is weak. Consider using 8+ characters.' };
    }
    return { valid: true, message: undefined };
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setNotice('All fields are required.');
      setNotice('All fields are required.');
      return;
    }

    if (!validateEmail(email)) {
      setNotice('Please enter a valid email address.');
      setNotice('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setNotice('Passwords do not match.');
      setNotice('Passwords do not match.');
      return;
    }

    const pwdValid = validatePassword(password);
    if (!pwdValid.valid) {
      setNotice(pwdValid.message || 'Password does not meet requirements.');
      setNotice(pwdValid.message || 'Password does not meet requirements.');
      return;
    }

    setIsLoading(true);
    setNotice('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: process.env.EXPO_PUBLIC_SUPABASE_URL,
        },
      });

      if (error) {
        setNotice(error.message || 'Sign-up failed. Please try again.');
        return;
      }

      // Sign-up successful - navigate to login tab
      setTab('log-in');
      setNotice('Account created! Please log in with your email and password.');
    } catch (err: any) {
      setNotice(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogIn = async () => {
    if (!loginEmail || !loginPassword) {
      setNotice('All fields are required.');
      setNotice('All fields are required.');
      return;
    }

    if (!validateEmail(loginEmail)) {
      setNotice('Please enter a valid email address.');
      setNotice('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setNotice('');

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setNotice(error.message || 'Invalid email or password. Please try again.');
        return;
      }

      // Sign-in successful
      setNotice('You are signed in to EcoEcho.');
      
      // Small delay then navigate home
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      setNotice(err.message || 'Log-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail || !validateEmail(loginEmail)) {
      setNotice('Please enter a valid email address.');
      setNotice('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setNotice('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/callback`,
      });

      if (error) {
        setNotice(error.message || 'Failed to send password reset email. Please try again.');
        return;
      }

      setNotice('Password reset email sent. Please check your inbox and follow the instructions to return to the app.');
    } catch (err: any) {
      setNotice(err.message || 'Failed to send password reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (notice) {
      const timeoutId = setTimeout(() => setNotice(''), 8000);
      return () => clearTimeout(timeoutId);
    }
  }, [notice]);

  // Determine which form to show based on tab
  const isSignUpTab = tab === 'sign-up';

  // Sign Up form fields
  const signUpForm = (
    <View style={styles.form}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <Text style={styles.label}>Email Address</Text>
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
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="next"
      />
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="done"
      />
      <View style={styles.buttonRow}>
        <ActionButton
          label="Create Account"
          disabled={isLoading}
          onPress={handleSignUp}
        />
      </View>
      {notice ? <InlineNotice kind="error" message={notice} /> : null}
    </View>
  );

  // Log In form
  const logInForm = (
    <View style={styles.form}>
      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={loginEmail}
        onChangeText={setLoginEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        autoComplete="email"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={loginPassword}
        onChangeText={setLoginPassword}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="done"
      />
      <View style={styles.buttonRow}>
        <ActionButton label="Log In" disabled={isLoading} onPress={handleLogIn} />
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tab selector
  const tabButtons = (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          tab === 'sign-up' && styles.tabButtonActive,
        ]}
        onPress={() => setTab('sign-up')}
      >
        <Text style={styles.tabText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          tab === 'log-in' && styles.tabButtonActive,
        ]}
        onPress={() => setTab('log-in')}
      >
        <Text style={styles.tabText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>EcoEcho Auth</Text>
          <Text style={styles.headerSubtitle}>Sign in or create an account</Text>
        </View>

        {tabButtons}

        {isSignUpTab ? signUpForm : logInForm}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInAction onNotice={setNotice} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    marginHorizontal: 24,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: OnboardingColors.paleGreen,
  },
  tabText: {
    color: OnboardingColors.forest,
    fontSize: 14,
    fontWeight: '600',
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
  buttonRow: {
    marginTop: 16,
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
  forgotLink: {
    marginTop: 8,
  },
  forgotText: {
    color: OnboardingColors.forest,
    fontSize: 12,
  },
});