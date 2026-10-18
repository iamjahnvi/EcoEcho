import * as Crypto from 'expo-crypto';
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

function getSupabaseErrorMessage(error: unknown) {
  if (error instanceof Error && /network|timeout|offline|connect/i.test(error.message)) {
    return 'Could not connect to Supabase. Check your network connection and try again.';
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    if (error.status === 400 || error.status === 401) {
      return 'Supabase rejected Google sign-in. Check that Google Auth is enabled and configured in your Supabase project.';
    }
    if (error.status === 429) {
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    }
  }

  return 'Supabase could not complete Google sign-in. Please try again.';
}

function getSignInErrorMessage(error: unknown, googleSignIn?: GoogleSignInModule) {
  if (error instanceof Error && /Failed to get NitroModules|native "NitroModules"/i.test(error.message)) {
    return 'Google sign-in is unavailable in this app build. Install a new EAS development build with the native Nitro modules included.';
  }

  if (error instanceof Error && error.message.startsWith('Supabase is not configured.')) {
    return error.message;
  }
  if (error instanceof Error && error.message.startsWith('Google sign-in is not configured.')) {
    return error.message;
  }

  if (googleSignIn?.isErrorWithCode(error)) {
    switch (error.code) {
      case googleSignIn.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play services are missing or out of date. Update Google Play services and try again.';
      case googleSignIn.statusCodes.DEVELOPER_ERROR:
        return 'Google sign-in configuration was rejected. Check the Android package name, signing SHA-1, and Web client ID.';
      case googleSignIn.statusCodes.SIGN_IN_CANCELLED:
        return 'Google sign-in was cancelled.';
      case googleSignIn.statusCodes.IN_PROGRESS:
        return 'Google sign-in is already in progress. Please wait and try again.';
      case googleSignIn.statusCodes.ONE_TAP_START_FAILED:
        return 'Google sign-in could not start. Check your network connection and Google Play services.';
      case googleSignIn.statusCodes.SIGN_IN_REQUIRED:
        return 'Google could not complete sign-in. Please try again.';
    }
  }

  if (error instanceof Error && /network|timeout|offline|connect/i.test(error.message)) {
    return 'Google sign-in could not connect. Check your network connection and try again.';
  }

  return 'Google sign-in failed. Check your connection and Google account configuration, then try again.';
}

export function GoogleSignInAction({ onNotice }: GoogleSignInActionProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn() {
    if (isSigningIn) return;

    setIsSigningIn(true);
    let googleSignIn: GoogleSignInModule | undefined;

    try {
      googleSignIn = await import('react-native-nitro-google-signin');
      const supabase = getSupabaseClient();
      const nonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      configureGoogleSignIn(googleSignIn, hashedNonce);
      await googleSignIn.GoogleOneTapSignIn.checkPlayServices();

      let response = await googleSignIn.GoogleOneTapSignIn.signIn();
      if (googleSignIn.isCancelledResponse(response)) {
        onNotice('Google sign-in was cancelled.');
        return;
      }

      if (googleSignIn.isNoSavedCredentialFoundResponse(response)) {
        response = await googleSignIn.GoogleOneTapSignIn.createAccount();
      }

      if (googleSignIn.isCancelledResponse(response)) {
        onNotice('Google sign-in was cancelled.');
        return;
      }

      if (googleSignIn.isNoSavedCredentialFoundResponse(response)) {
        response = await googleSignIn.GoogleOneTapSignIn.presentExplicitSignIn();
      }

      if (googleSignIn.isCancelledResponse(response)) {
        onNotice('Google sign-in was cancelled.');
        return;
      }

      if (!googleSignIn.isSuccessResponse(response) || !response.data.idToken) {
        onNotice('Google did not return an identity token. No EcoEcho session was created.');
        return;
      }

      const { accessToken } = await googleSignIn.GoogleOneTapSignIn.getTokens();
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
        access_token: accessToken,
        nonce,
      });

      if (error) {
        onNotice(getSupabaseErrorMessage(error));
        return;
      }

      if (!data.session) {
        onNotice('Supabase did not return a session. No EcoEcho login was completed.');
        return;
      }

      onNotice('You are signed in to EcoEcho with Google.');
    } catch (error) {
      onNotice(getSignInErrorMessage(error, googleSignIn));
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
