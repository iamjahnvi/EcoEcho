import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';

import { ActionButton } from '@/components/onboarding-ui';
import { getSupabaseClient } from '@/lib/supabase';

type GoogleSignInActionProps = {
  onNotice: (message: string) => void;
};

type GoogleSignInModule = typeof import('react-native-nitro-google-signin');

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

function configureGoogleSignIn(googleSignIn: GoogleSignInModule, nonce: string) {
  if (!webClientId) {
    throw new Error(
      'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to the Web OAuth client ID.'
    );
  }

  googleSignIn.GoogleOneTapSignIn.configure({
    webClientId,
    nonce,
    autoSelectOnSignIn: false,
  });
}

function getErrorProperties(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: unknown; message?: unknown; status?: unknown };
    const code =
      typeof candidate.code === 'string'
        ? candidate.code.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 80)
        : undefined;
    return {
      code: code || undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
      status: typeof candidate.status === 'number' ? String(candidate.status) : undefined,
    };
  }

  return {
    code: undefined,
    message: typeof error === 'string' ? error : undefined,
    status: undefined,
  };
}

function sanitizeDiagnosticMessage(message: string) {
  return message
    .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted token]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(
      /\b(access_token|refresh_token|id_token|client_secret|token)\s*[:=]\s*[^,\s&]+/gi,
      '$1=[redacted]'
    )
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted account]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted number]')
    .slice(0, 240);
}

function getSignInErrorMessage(
  error: unknown,
  stage: string,
  googleSignIn?: GoogleSignInModule
) {
  if (error instanceof Error && /Failed to get NitroModules|native "NitroModules"/i.test(error.message)) {
    return 'Google sign-in is unavailable in this app build. Install a new EAS development build with the native Nitro modules included.';
  }

  if (error instanceof Error && error.message.startsWith('Supabase is not configured.')) {
    return error.message;
  }
  if (error instanceof Error && error.message.startsWith('Google sign-in is not configured.')) {
    return error.message;
  }

  const properties = getErrorProperties(error);
  const nativeCode = googleSignIn?.isErrorWithCode(error)
    ? error.code.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 80)
    : undefined;
  const code = nativeCode ?? properties.code;
  const status = properties.status ? `HTTP ${properties.status}` : undefined;
  const diagnostic = properties.message
    ? sanitizeDiagnosticMessage(properties.message)
    : undefined;
  const detail = [code ?? status ?? 'no provider code', diagnostic].filter(Boolean).join(': ');

  if (stage === 'Supabase authentication') {
    return `Supabase authentication failed [${detail}]. Check the Google provider configuration and network connection.`;
  }

  if (code === googleSignIn?.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return `Google Play services are unavailable [${detail}]. Update Google Play services and try again.`;
  }
  if (code === googleSignIn?.statusCodes.DEVELOPER_ERROR) {
    return `Google OAuth configuration was rejected [${detail}]. Check the Android package name, signing SHA-1, and Web client ID.`;
  }
  if (code === googleSignIn?.statusCodes.SIGN_IN_CANCELLED) {
    return `Google sign-in was cancelled [${detail}].`;
  }

  return `${stage} failed [${detail}].`;
}

export function GoogleSignInAction({ onNotice }: GoogleSignInActionProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn() {
    if (isSigningIn) return;

    setIsSigningIn(true);
    let googleSignIn: GoogleSignInModule | undefined;
    let stage = 'Google module loading';

    try {
      googleSignIn = await import('react-native-nitro-google-signin');
      stage = 'Supabase client initialization';
      const supabase = getSupabaseClient();
      const nonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      stage = 'Google OAuth configuration';
      configureGoogleSignIn(googleSignIn, hashedNonce);
      stage = 'Google Play services check';
      await googleSignIn.GoogleOneTapSignIn.checkPlayServices();

      stage = 'Google sign-in';
      let response = await googleSignIn.GoogleOneTapSignIn.signIn();
      if (googleSignIn.isCancelledResponse(response)) {
        onNotice(
          'Google returned a cancellation response without an error code. If you dismissed the account picker, sign-in was cancelled; otherwise check the Android OAuth client package name and signing SHA-1.'
        );
        return;
      }

      if (googleSignIn.isNoSavedCredentialFoundResponse(response)) {
        response = await googleSignIn.GoogleOneTapSignIn.createAccount();
      }

      if (googleSignIn.isCancelledResponse(response)) {
        onNotice(
          'Google returned a cancellation response without an error code. If you dismissed the account picker, sign-in was cancelled; otherwise check the Android OAuth client package name and signing SHA-1.'
        );
        return;
      }

      if (googleSignIn.isNoSavedCredentialFoundResponse(response)) {
        response = await googleSignIn.GoogleOneTapSignIn.presentExplicitSignIn();
      }

      if (googleSignIn.isCancelledResponse(response)) {
        onNotice(
          'Google returned a cancellation response without an error code. If you dismissed the account picker, sign-in was cancelled; otherwise check the Android OAuth client package name and signing SHA-1.'
        );
        return;
      }

      if (!googleSignIn.isSuccessResponse(response)) {
        onNotice(`Google returned no account credential [${response.type}]. No session was created.`);
        return;
      }
      if (!response.data.idToken) {
        onNotice('Google returned no ID token [MISSING_ID_TOKEN]. No session was created.');
        return;
      }

      stage = 'Google token retrieval';
      const { accessToken } = await googleSignIn.GoogleOneTapSignIn.getTokens();
      stage = 'Supabase authentication';
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
        access_token: accessToken,
        nonce,
      });

      if (error) {
        onNotice(getSignInErrorMessage(error, stage, googleSignIn));
        return;
      }

      if (!data.session) {
        onNotice('Supabase did not return a session. No EcoEcho login was completed.');
        return;
      }

      const { data: authenticatedSession, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !authenticatedSession.session?.user.id) {
        onNotice('Google sign-in completed, but the EcoEcho session could not be retrieved. Please try again.');
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      onNotice(getSignInErrorMessage(error, stage, googleSignIn));
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <ActionButton
      label="Continue with Google"
      variant="outlined"
      disabled={isSigningIn}
      onPress={handleSignIn}
    />
  );
}
