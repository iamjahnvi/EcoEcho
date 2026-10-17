import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, InlineNotice, OnboardingColors } from '@/components/onboarding-ui';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PhoneScreen() {
  const theme = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<'info' | 'error'>('info');

  function handleSendOtp() {
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setNoticeKind('error');
      setNotice('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setNoticeKind('info');
    setNotice('Phone verification is not configured yet. No OTP was sent.');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.eyebrow}>WELCOME TO ECOECHO</Text>
            <Text style={[styles.heading, { color: theme.text }]}>ENTER YOUR PHONE NUMBER</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              We will send a one-time OTP. This is not spam.
            </Text>

            <View style={styles.phoneRow}>
              <View
                accessibilityLabel="Country code India, plus 91"
                style={styles.countryCode}>
                <Text style={styles.countryLabel}>INDIA</Text>
                <Text style={styles.countryNumber}>+91</Text>
              </View>
              <TextInput
                accessibilityLabel="Enter your 10-digit Indian mobile number"
                autoComplete="tel-national"
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(value) => {
                  setPhoneNumber(value.replace(/\D/g, '').slice(0, 10));
                  setNotice('');
                }}
                placeholder="ENTER YOUR NUMBER"
                placeholderTextColor={OnboardingColors.muted}
                returnKeyType="done"
                style={styles.phoneInput}
                textContentType="telephoneNumber"
                value={phoneNumber}
              />
            </View>

            <ActionButton label="SEND OTP" onPress={handleSendOtp} />
            {notice ? <InlineNotice kind={noticeKind} message={notice} /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 18,
  },
  eyebrow: {
    color: OnboardingColors.leaf,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.7,
    textAlign: 'center',
  },
  heading: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: OnboardingColors.border,
    borderRadius: 18,
    padding: 7,
    backgroundColor: OnboardingColors.panel,
  },
  countryCode: {
    width: 82,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: OnboardingColors.border,
    gap: 2,
  },
  countryLabel: {
    color: OnboardingColors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  countryNumber: {
    color: OnboardingColors.forest,
    fontSize: 17,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 13,
    color: OnboardingColors.ink,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
