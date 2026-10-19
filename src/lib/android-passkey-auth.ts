import type { Passkey } from 'react-native-passkey';
import type { getSupabaseClient } from '@/lib/supabase';

type SupabaseAuth = ReturnType<typeof getSupabaseClient>['auth'];
type NativePasskey = Pick<typeof Passkey, 'create' | 'get'>;

type PasskeyOperation = 'sign-in' | 'registration';
const ANDROID_PASSKEY_RP_ID = 'ecoecho-sigma.vercel.app';

type PasskeyErrorShape = {
  code?: unknown;
  error?: unknown;
};

function getErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null) return '';

  const properties = error as PasskeyErrorShape;
  if (typeof properties.error === 'string') return properties.error;
  return typeof properties.code === 'string' ? properties.code : '';
}

export function getAndroidPasskeyErrorMessage(
  error: unknown,
  operation: PasskeyOperation
) {
  const code = getErrorCode(error);

  if (['UserCancelled', 'ERROR_CEREMONY_ABORTED', 'NotAllowedError'].includes(code)) {
    return `Passkey ${operation} was cancelled. You can try again or use Google sign-in.`;
  }

  if (['NoCredentials', 'NoCreateOption'].includes(code)) {
    return operation === 'sign-in'
      ? 'No matching passkey was found. Sign in with Google, then register a passkey on this device.'
      : 'No passkey provider is available. Set up Google Password Manager or another Android Credential Manager provider and try again.';
  }

  if (['NotSupported', 'NotSupportedError'].includes(code)) {
    return 'This Android device does not support Credential Manager passkeys. Update Android and Google Play services, or use Google sign-in.';
  }

  if (/origin|relying.?party|rp.?id|passkey_disabled|NotConfigured/i.test(code)) {
    return 'Passkey setup is incomplete. Check that Supabase uses ecoecho-sigma.vercel.app as the RP ID and allows this APK signing origin, and that the domain serves a matching Digital Asset Links file.';
  }

  return `Passkey ${operation} failed. Check the Supabase passkey RP ID/origin and Android Digital Asset Links setup, then retry or use Google sign-in.`;
}

export async function signInWithAndroidPasskey(
  auth: SupabaseAuth,
  passkeys: NativePasskey
) {
  const { data: optionsData, error: optionsError } =
    await auth.passkey.startAuthentication();
  if (optionsError) throw optionsError;
  if (!optionsData) throw new Error('Supabase returned no passkey challenge.');
  const options = optionsData.options;
  const nativeCredential = await passkeys.get({
    challenge: options.challenge,
    rpId: options.rpId ?? ANDROID_PASSKEY_RP_ID,
    timeout: options.timeout,
    allowCredentials: options.allowCredentials?.map(({ id }) => ({
      id,
      type: 'public-key',
    })),
    userVerification: options.userVerification,
  });
  const credential = {
    ...nativeCredential,
    rawId: nativeCredential.rawId ?? nativeCredential.id,
    type: 'public-key' as const,
    clientExtensionResults: {},
  };

  const { data, error } = await auth.passkey.verifyAuthentication({
    challengeId: optionsData.challenge_id,
    credential,
  });
  if (error) throw error;
  if (!data?.session?.user?.id || !data.user?.id) {
    throw new Error('Supabase did not confirm passkey sign-in with a session.');
  }

  return data;
}

export async function registerAndroidPasskey(
  auth: SupabaseAuth,
  passkeys: NativePasskey
) {
  const { data: sessionData, error: sessionError } = await auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user.id || sessionData.session.user.is_anonymous) {
    throw new Error('Sign in with Google before registering a passkey.');
  }

  const { data: optionsData, error: optionsError } =
    await auth.passkey.startRegistration();
  if (optionsError) throw optionsError;
  if (!optionsData) throw new Error('Supabase returned no passkey challenge.');
  const options = optionsData.options;
  const nativeCredential = await passkeys.create({
    challenge: options.challenge,
    rp: {
      id: options.rp.id ?? ANDROID_PASSKEY_RP_ID,
      name: options.rp.name,
    },
    user: {
      id: options.user.id,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map(({ id }) => ({
      id,
      type: 'public-key',
    })),
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
  });
  const credential = {
    ...nativeCredential,
    type: 'public-key' as const,
    clientExtensionResults: {},
  };

  const { data, error } = await auth.passkey.verifyRegistration({
    challengeId: optionsData.challenge_id,
    credential,
  });
  if (error) throw error;
  if (!data?.id) {
    throw new Error('Supabase did not confirm passkey registration.');
  }

  return data;
}
