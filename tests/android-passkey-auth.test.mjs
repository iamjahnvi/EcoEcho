import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAndroidPasskeyErrorMessage,
  registerAndroidPasskey,
  signInWithAndroidPasskey,
} from '../src/lib/android-passkey-auth.ts';

test('native sign-in verifies the Credential Manager assertion with its Supabase challenge', async () => {
  const calls = [];
  const nativeCredential = {
    id: 'credential-id',
    response: {
      authenticatorData: 'authenticator-data',
      clientDataJSON: 'client-data',
      signature: 'signature',
    },
  };
  const auth = {
    passkey: {
      startAuthentication: async () => {
        calls.push('start');
        return {
          data: {
            challenge_id: 'auth-challenge',
            options: { challenge: 'challenge', rpId: 'ecoecho-sigma.vercel.app' },
          },
          error: null,
        };
      },
      verifyAuthentication: async (params) => {
        calls.push(params);
        return {
          data: {
            session: { user: { id: 'user-id' } },
            user: { id: 'user-id' },
          },
          error: null,
        };
      },
    },
  };
  const passkeys = {
    get: async (options) => {
      calls.push(options);
      return nativeCredential;
    },
  };

  const result = await signInWithAndroidPasskey(auth, passkeys);

  assert.equal(result.user.id, 'user-id');
  assert.equal(calls[0], 'start');
  assert.equal(calls[1].challenge, 'challenge');
  assert.equal(calls[1].rpId, 'ecoecho-sigma.vercel.app');
  assert.equal(calls[2].challengeId, 'auth-challenge');
  assert.deepEqual(calls[2].credential, {
    ...nativeCredential,
    rawId: 'credential-id',
    type: 'public-key',
    clientExtensionResults: {},
  });
});

test('registration requires an authenticated account and verifies its native attestation', async () => {
  const calls = [];
  const auth = {
    getSession: async () => ({
      data: { session: { user: { id: 'user-id', is_anonymous: false } } },
      error: null,
    }),
    passkey: {
      startRegistration: async () => ({
        data: {
          challenge_id: 'registration-challenge',
          options: {
            challenge: 'challenge',
            rp: { id: 'ecoecho-sigma.vercel.app', name: 'EcoEcho' },
            user: { id: 'user-id', name: 'EcoEcho user', displayName: 'EcoEcho user' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          },
        },
        error: null,
      }),
      verifyRegistration: async (params) => {
        calls.push(params);
        return { data: { id: 'registered-passkey' }, error: null };
      },
    },
  };
  const passkeys = {
    create: async (options) => {
      calls.push(options);
      return {
        id: 'credential-id',
        rawId: 'credential-id',
        response: { clientDataJSON: 'client-data', attestationObject: 'attestation' },
      };
    },
  };

  const result = await registerAndroidPasskey(auth, passkeys);

  assert.equal(result.id, 'registered-passkey');
  assert.equal(calls[0].rp.id, 'ecoecho-sigma.vercel.app');
  assert.equal(calls[1].challengeId, 'registration-challenge');
  assert.equal(calls[1].credential.type, 'public-key');
  assert.deepEqual(calls[1].credential.clientExtensionResults, {});
});

test('registration does not start when there is no signed-in user', async () => {
  let started = false;
  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    passkey: {
      startRegistration: async () => {
        started = true;
        return { data: null, error: null };
      },
    },
  };

  await assert.rejects(
    registerAndroidPasskey(auth, { create: async () => assert.fail('must not create') }),
    /Sign in with Google/
  );
  assert.equal(started, false);
});

test('sign-in stops without running Credential Manager when Supabase rejects the challenge request', async () => {
  let nativeCall = false;
  const auth = {
    passkey: {
      startAuthentication: async () => ({
        data: null,
        error: new Error('Passkey service unavailable'),
      }),
    },
  };

  await assert.rejects(
    signInWithAndroidPasskey(auth, { get: async () => (nativeCall = true) }),
    /Passkey service unavailable/
  );
  assert.equal(nativeCall, false);
});

test('native cancellation and RP setup failures have actionable messages', () => {
  assert.match(
    getAndroidPasskeyErrorMessage({ error: 'UserCancelled' }, 'sign-in'),
    /was cancelled/
  );
  assert.match(
    getAndroidPasskeyErrorMessage({ code: 'webauthn_origin_not_allowed' }, 'registration'),
    /Digital Asset Links/
  );
});
