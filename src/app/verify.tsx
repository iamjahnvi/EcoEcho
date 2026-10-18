import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { getSupabaseClient } from '@/lib/supabase';

const DEFAULT_OTP_LENGTH = 6;
const otpLengthSetting = process.env.EXPO_PUBLIC_SUPABASE_SMS_OTP_LENGTH?.trim();
const parsedOtpLength = otpLengthSetting ? Number(otpLengthSetting) : DEFAULT_OTP_LENGTH;
const isOtpLengthSettingValid =
  Number.isInteger(parsedOtpLength) && parsedOtpLength >= 4 && parsedOtpLength <= 10;
const OTP_LENGTH = isOtpLengthSettingValid ? parsedOtpLength : DEFAULT_OTP_LENGTH;

function maskIndianNumber(phoneNumber: string) {
  const nationalNumber = phoneNumber.slice(3);
  return `+91 ${nationalNumber.slice(0, 4)}••••${nationalNumber.slice(-2)}`;
}

export default function VerifyScreen() {
  const theme = useTheme();
  const { phone: phoneParam, sentAt: sentAtParam } = useLocalSearchParams<{
    phone?: string;
    sentAt?: string;
  }>();
  const phoneNumber = typeof phoneParam === 'string' ? phoneParam.trim() : '';
  const isValidNumber = /^\+91[6-9]\d{9}$/.test(phoneNumber);
  const sentAt = typeof sentAtParam === 'string' ? Number(sentAtParam) : Number.NaN;
  const initialDeadline =
    Number.isSafeInteger(sentAt) && sentAt > 0 ? sentAt + 60_000 : null;
  const hasOtpRequest = initialDeadline !== null;
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    initialDeadline === null
      ? 0
      : Math.min(60, Math.max(0, Math.ceil((initialDeadline - Date.now()) / 1000)))
  );
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [notice, setNotice] = useState(
    !isValidNumber
      ? 'No active phone verification. Return to phone entry and request a code.'
      : !isOtpLengthSettingValid
        ? 'EXPO_PUBLIC_SUPABASE_SMS_OTP_LENGTH must be a whole number from 4 to 10.'
        : ''
  );
  const [noticeKind, setNoticeKind] = useState<'info' | 'error'>(
    isValidNumber && isOtpLengthSettingValid ? 'info' : 'error'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const canUseOtpFlow = isValidNumber && isOtpLengthSettingValid && hasOtpRequest;
  const isCountingDown = remainingSeconds > 0;

  useEffect(() => {
    if (!canUseOtpFlow || !isCountingDown) return;

    const intervalId = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [canUseOtpFlow, isCountingDown]);

  function handleCodeChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    const nextCode = [...code];
    setNotice('');

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
    if (digits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function handleVerify() {
    if (isSubmittingRef.current) return;
    if (!canUseOtpFlow) {
      setNoticeKind('error');
      setNotice(
        isValidNumber
          ? 'The configured SMS OTP length is invalid.'
          : 'No valid phone number is associated with this verification request.'
      );
      return;
    }
    if (code.some((digit) => !digit)) {
      setNoticeKind('error');
      setNotice(`Enter the complete ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setNotice('');
    try {
      const { data, error } = await getSupabaseClient().auth.verifyOtp({
        phone: phoneNumber,
        token: code.join(''),
        type: 'sms',
      });

      if (error) {
        setNoticeKind('error');
        setNotice(error.message || 'The verification code could not be confirmed.');
        return;
      }

      if (!data.session?.access_token || !data.session.user?.id) {
        setNoticeKind('error');
        setNotice('Supabase did not return a valid session. Phone sign-in was not completed.');
        return;
      }

      setNoticeKind('info');
      setNotice('Your phone number is verified and you are signed in.');
    } catch (error) {
      setNoticeKind('error');
      setNotice(
        error instanceof Error
          ? error.message
          : 'Verification failed. Check your connection and try again.'
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (isSubmittingRef.current || !canUseOtpFlow || remainingSeconds > 0) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setNotice('');
    try {
      const { error } = await getSupabaseClient().auth.resend({
        phone: phoneNumber,
        type: 'sms',
      });

      if (error) {
        setNoticeKind('error');
        setNotice(error.message || 'A new verification code could not be sent.');
        return;
      }

      setCode(Array(OTP_LENGTH).fill(''));
      setRemainingSeconds(60);
      setNoticeKind('info');
      setNotice('A new verification code was requested. Check your messages.');
    } catch (error) {
      setNoticeKind('error');
      setNotice(
        error instanceof Error
          ? error.message
          : 'A new verification code could not be requested. Check your connection and try again.'
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
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
                {isValidNumber
                  ? 'Enter the SMS code to continue.'
                  : 'Request a verification code from the phone number screen.'}
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
                  editable={!isSubmitting}
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
              <Text style={styles.timer}>
                {`${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
                  remainingSeconds % 60
                ).padStart(2, '0')}`}
              </Text>
              <Text style={styles.timerCaption}>Enter the code sent to your phone.</Text>
            </View>

            <ActionButton
              label={isSubmitting ? 'PLEASE WAIT...' : 'Resend OTP'}
              variant="outlined"
              disabled={isSubmitting || !canUseOtpFlow || remainingSeconds > 0}
              onPress={handleResend}
            />

            {notice ? <InlineNotice kind={noticeKind} message={notice} /> : null}

            <ActionButton
              label={isSubmitting ? 'VERIFYING...' : "LET'S GOOOOO"}
              disabled={isSubmitting || !canUseOtpFlow || code.some((digit) => !digit)}
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
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeInput: {
    width: 57,
    maxWidth: 57,
    flex: 1,
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
