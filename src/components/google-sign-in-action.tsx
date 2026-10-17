import { ActionButton } from '@/components/onboarding-ui';

type GoogleSignInActionProps = {
  onNotice: (message: string) => void;
};

export function GoogleSignInAction({ onNotice }: GoogleSignInActionProps) {
  return (
    <ActionButton
      label="Continue with Google"
      variant="outlined"
      onPress={() => onNotice('Google sign-in is currently available on Android only.')}
    />
  );
}
