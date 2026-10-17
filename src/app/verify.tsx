import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
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

const OTP_LENGTH = 4;

function maskIndianNumber(phoneNumber: string) {
  return `+91 ${phoneNumber.slice(0, 4)}••••${phoneNumber.slice(-2)}`;
}

export default function VerifyScreen() {
  const theme = useTheme();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const phoneNumber = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  const isValidNumber = /^[6-9]\d{9}$/.test(phoneNumber);
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [notice, setNotice] = useState(
    'No OTP was sent. Phone verification is not configured, so there is no active verification session.'
  );
  const inputRefs = useRef<(TextInput | null)[]>([]);

  function handleCodeChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    const nextCode = [...code];

    if (digits.length > 1) {
      const pastedDigits = digits.slice(0, OTP_LENGTH - index).split('');
      pastedDigits.forEach((digit, offset) => {
        nextCode[index + offset] = digit;
      });
      setCode(nextCode);
      inputRefs.current[Math.min(index + pastedDigits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    nextCode[index] = digits;
    setCode(nextCode);
    setNotice('');
    if (digits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleVerify() {
    if (code.some((digit) => !digit)) return;
    setNotice('This code cannot be verified because phone authentication is not configured.');
  }

  function handleResend() {
    setNotice('No OTP can be resent because phone verification is not configured.');
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
            <View style={styles.destinationCard}>
              <Text style={styles.destinationLabel}>
                {isValidNumber ? 'PHONE NUMBER' : 'NO ACTIVE VERIFICATION'}
              </Text>
              {isValidNumber ? (
                <Text style={styles.destinationNumber}>{maskIndianNumber(phoneNumber)}</Text>
              ) : null}
              <Text style={styles.inactiveMessage}>
                No OTP was sent. Phone verification is not configured.
              </Text>
            </View>

            <Text style={[styles.instruction, { color: theme.text }]}>Drop the code here.</Text>

            <View style={styles.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  accessibilityLabel={`OTP digit ${index + 1}`}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? OTP_LENGTH : 1}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={({ nativeEvent }) => {
                    if (
                      nativeEvent.key === 'Backspace' &&
                      !code[index] &&
                      index > 0
                    ) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  selectTextOnFocus
                  style={styles.codeInput}
                  value={digit}
                />
              ))}
            </View>

            <View style={styles.timerArea}>
              <Text style={styles.timer}>00:49</Text>
              <Text style={styles.timerCaption}>Timer starts only after an OTP is sent.</Text>
            </View>

            <ActionButton label="Resend OTP" variant="outlined" onPress={handleResend} />

            {notice ? <InlineNotice message={notice} /> : null}

            <ActionButton
              label="LET'S GOOOOO"
              disabled={code.some((digit) => !digit)}
              onPress={handleVerify}
            />
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
    paddingVertical: 20,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    gap: 17,
  },
  destinationCard: {
    width: '100%',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OnboardingColors.border,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: OnboardingColors.panel,
  },
  destinationLabel: {
    color: OnboardingColors.leaf,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '800',
    textAlign: 'center',
  },
  destinationNumber: {
    color: OnboardingColors.forest,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  inactiveMessage: {
    color: OnboardingColors.warning,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  codeInput: {
    width: 57,
    height: 66,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: OnboardingColors.border,
    backgroundColor: OnboardingColors.panel,
    color: OnboardingColors.forest,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  timerArea: {
    alignItems: 'center',
    gap: 2,
  },
  timer: {
    color: OnboardingColors.forest,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerCaption: {
    color: OnboardingColors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
