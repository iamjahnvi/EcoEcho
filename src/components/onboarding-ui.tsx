import { Pressable, StyleSheet, Text, View } from 'react-native';

export const OnboardingColors = {
  forest: '#244B35',
  leaf: '#497A4F',
  paleGreen: '#EAF2E8',
  border: '#C8D6C7',
  panel: '#F8FAF6',
  ink: '#1F3024',
  muted: '#69786B',
  warning: '#8A5A17',
  warningBackground: '#FFF5E5',
  error: '#A23932',
  errorBackground: '#FFF0EE',
  white: '#FFFFFF',
} as const;

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outlined';
  disabled?: boolean;
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: ActionButtonProps) {
  const outlined = variant === 'outlined';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outlined ? styles.outlinedButton : styles.primaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}>
      <Text style={[styles.buttonLabel, outlined && styles.outlinedLabel]}>{label}</Text>
    </Pressable>
  );
}

type InlineNoticeProps = {
  message: string;
  kind?: 'info' | 'error';
};

export function InlineNotice({ message, kind = 'info' }: InlineNoticeProps) {
  const isError = kind === 'error';

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.notice,
        isError ? styles.errorNotice : styles.infoNotice,
      ]}>
      <Text style={[styles.noticeText, isError && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primaryButton: {
    backgroundColor: OnboardingColors.forest,
    borderColor: OnboardingColors.forest,
  },
  outlinedButton: {
    backgroundColor: OnboardingColors.white,
    borderColor: OnboardingColors.forest,
  },
  disabledButton: {
    opacity: 0.48,
  },
  pressedButton: {
    opacity: 0.78,
  },
  buttonLabel: {
    color: OnboardingColors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  outlinedLabel: {
    color: OnboardingColors.forest,
  },
  notice: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  infoNotice: {
    backgroundColor: OnboardingColors.warningBackground,
  },
  errorNotice: {
    backgroundColor: OnboardingColors.errorBackground,
  },
  noticeText: {
    color: OnboardingColors.warning,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: OnboardingColors.error,
  },
});
