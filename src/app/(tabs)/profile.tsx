import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  FocusEvent,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, InlineNotice, OnboardingColors } from '@/components/onboarding-ui';
import { getSupabaseClient } from '@/lib/supabase';
import { hasCompletedProfile } from '@/lib/onboarding';

type ProfileDraft = {
  username: string;
  fullName: string;
  bio: string;
  phone: string;
  birthday: string;
  linkedin: string;
  x: string;
  instagram: string;
};

type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

const emptyProfile: ProfileDraft = {
  username: '',
  fullName: '',
  bio: '',
  phone: '',
  birthday: '',
  linkedin: '',
  x: '',
  instagram: '',
};

const metadataKeys: Record<keyof ProfileDraft, string> = {
  username: 'profile_username',
  fullName: 'full_name',
  bio: 'profile_bio',
  phone: 'profile_phone',
  birthday: 'profile_birthday',
  linkedin: 'profile_linkedin',
  x: 'profile_x',
  instagram: 'profile_instagram',
};

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(2000, 0, 1, 12);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function readableDate(value: string) {
  if (!value) return '';
  return parseLocalDate(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function fieldFromMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' ? value : '';
}

function validateSocial(value: string, service: 'linkedin' | 'x' | 'instagram') {
  if (!value.trim()) return '';
  const clean = value.trim();
  const urlPattern = /^https?:\/\//i;
  if (urlPattern.test(clean)) {
    try {
      const url = new URL(clean);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      const validHost = service === 'linkedin'
        ? host === 'linkedin.com'
        : service === 'x'
          ? host === 'x.com' || host === 'twitter.com'
          : host === 'instagram.com';
      return validHost && url.pathname.length > 1 ? '' : `Enter a valid ${service === 'x' ? 'X' : service} profile URL or username.`;
    } catch {
      return `Enter a valid ${service === 'x' ? 'X' : service} profile URL or username.`;
    }
  }

  const handle = clean.replace(/^@/, '');
  const handlePattern = service === 'linkedin' ? /^[\w-]{3,100}$/ : /^[A-Za-z0-9._]{1,30}$/;
  return handlePattern.test(handle) ? '' : `Enter a valid ${service === 'x' ? 'X' : service} profile URL or username.`;
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [userId, setUserId] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [email, setEmail] = useState('');
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfile);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  useEffect(() => {
    let active = true;
    void getSupabaseClient().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setNotice('Sign in to view and save your profile.');
        setIsLoading(false);
        return;
      }

      const metadata = data.user.user_metadata ?? {};
      setUserId(data.user.id);
      setIsProfileComplete(hasCompletedProfile(data.user));
      setEmail(data.user.email ?? '');
      setDraft({
        username: fieldFromMetadata(metadata, metadataKeys.username),
        fullName: fieldFromMetadata(metadata, metadataKeys.fullName),
        bio: fieldFromMetadata(metadata, metadataKeys.bio).slice(0, 200),
        phone: fieldFromMetadata(metadata, metadataKeys.phone),
        birthday: fieldFromMetadata(metadata, metadataKeys.birthday),
        linkedin: fieldFromMetadata(metadata, metadataKeys.linkedin),
        x: fieldFromMetadata(metadata, metadataKeys.x),
        instagram: fieldFromMetadata(metadata, metadataKeys.instagram),
      });
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      setNotice('Unable to load your profile. Please try again.');
      setIsLoading(false);
    });

    return () => { active = false; };
  }, []);

  const setField = (key: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: key === 'bio' ? value.slice(0, 200) : value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice('');
  };

  const keepFocusedFieldVisible = (event: FocusEvent) => {
    const focusedInput = event.nativeEvent.target;
    // Scroll the focused input above the keyboard. Scrolling to the end here
    // sends every field focus straight to the socials section.
    setTimeout(() => {
      scrollRef.current
        ?.getScrollResponder()
        .scrollResponderScrollNativeHandleToKeyboard(focusedInput, 96, true);
    }, 250);
  };

  const validate = () => {
    const next: ProfileErrors = {};
    const username = draft.username.trim();
    if (!username) next.username = 'Username is required.';
    else if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) next.username = 'Use 3–24 letters, numbers, or underscores.';

    if (!draft.fullName.trim()) next.fullName = 'Full name is required.';

    const digits = draft.phone.replace(/\D/g, '');
    if (!draft.phone.trim()) next.phone = 'Phone number is required.';
    else if (!/^[+\d().\-\s]+$/.test(draft.phone) || digits.length < 7 || digits.length > 15) {
      next.phone = 'Enter a valid phone number with 7–15 digits.';
    }

    next.linkedin = validateSocial(draft.linkedin, 'linkedin') || undefined;
    next.x = validateSocial(draft.x, 'x') || undefined;
    next.instagram = validateSocial(draft.instagram, 'instagram') || undefined;
    setErrors(next);
    return Object.values(next).every((value) => !value);
  };

  const saveProfile = async () => {
    if (!userId) {
      setNotice('Sign in to save your profile.');
      return;
    }
    if (!validate()) {
      setNotice('Please check the highlighted fields.');
      return;
    }

    setIsSaving(true);
    setNotice('');
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || user.id !== userId) throw new Error('Your session has changed. Sign in again to save your profile.');

      const metadata = { ...user.user_metadata };
      (Object.keys(metadataKeys) as (keyof ProfileDraft)[]).forEach((key) => {
        const value = draft[key].trim();
        // Leave empty optional values untouched so an incomplete edit cannot erase saved information.
        if (value || key === 'username' || key === 'fullName' || key === 'phone') {
          metadata[metadataKeys[key]] = value;
        }
      });
      metadata.profile_complete = true;
      metadata.profile_onboarding_started = true;

      const { error } = await supabase.auth.updateUser({ data: metadata });
      if (error) throw error;
      setIsProfileComplete(true);
      setNotice('Profile saved successfully.');
      setTimeout(() => router.replace('/(tabs)'), 700);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const signOut = async () => {
    setIsSigningOut(true);
    setNotice('');
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderField = (
    label: string,
    key: keyof ProfileDraft,
    placeholder: string,
    options: { multiline?: boolean; keyboardType?: 'default' | 'phone-pad'; autoCapitalize?: 'none' | 'words' | 'sentences' } = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={draft[key]}
        onChangeText={(value) => setField(key, value)}
        onFocus={keepFocusedFieldVisible}
        placeholder={placeholder}
        placeholderTextColor={OnboardingColors.muted}
        style={[styles.input, options.multiline && styles.bioInput, errors[key] && styles.inputError]}
        multiline={options.multiline}
        keyboardType={options.keyboardType ?? 'default'}
        autoCapitalize={options.autoCapitalize ?? 'sentences'}
        maxLength={key === 'bio' ? 200 : undefined}
        textAlignVertical={options.multiline ? 'top' : 'center'}
      />
      {key === 'bio' ? <Text style={styles.counter}>{draft.bio.length}/200</Text> : null}
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  const smallScreen = width < 420;
  const initials = (draft.fullName.trim() || email || 'E').slice(0, 1).toUpperCase();
  const pickerDate = draft.birthday ? parseLocalDate(draft.birthday) : new Date(2000, 0, 1, 12);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={OnboardingColors.forest} size={22} />
            </TouchableOpacity>
            <Text style={styles.heading}>{isProfileComplete ? 'MY PROFILE' : 'COMPLETE YOUR PROFILE'}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.overview}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.overviewText}>
              <Text style={styles.overviewName}>{draft.fullName || 'Your name'}</Text>
              <Text style={styles.overviewUsername}>{draft.username ? `@${draft.username}` : 'Set your username'}</Text>
              <Text numberOfLines={1} style={styles.overviewEmail}>{email || 'Email unavailable'}</Text>
            </View>
          </View>

          {isLoading ? <Text style={styles.status}>Loading your profile…</Text> : null}
          {!isLoading && !userId ? (
            <View style={styles.loginPrompt}>
              <Text style={styles.status}>{notice || 'Sign in to access your profile.'}</Text>
              <ActionButton label="Continue to sign in" onPress={() => router.push('/email')} />
            </View>
          ) : null}

          {userId ? <>
            {renderField('Username *', 'username', 'Choose a username', { autoCapitalize: 'none' })}
            {renderField('Full Name *', 'fullName', 'Enter your full name', { autoCapitalize: 'words' })}
            {renderField('Bio', 'bio', 'Tell us a little about yourself', { multiline: true })}

            <View style={[styles.contactRow, smallScreen && styles.contactColumn]}>
              <View style={styles.contactField}>
                {renderField('Phone Number *', 'phone', 'Enter phone number', { keyboardType: 'phone-pad', autoCapitalize: 'none' })}
              </View>
              <View style={styles.contactField}>
                <Text style={styles.label}>Email ID</Text>
                <TextInput
                  value={email}
                  editable={false}
                  selectTextOnFocus={false}
                  style={[styles.input, styles.readOnlyInput]}
                  accessibilityLabel={`Email address, read only: ${email}`}
                />
                <Text style={styles.helperText}>From your EcoEcho account</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Birthday</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowBirthdayPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={draft.birthday ? `Birthday, ${readableDate(draft.birthday)}` : 'Choose birthday'}
              >
                <Text style={draft.birthday ? styles.dateText : styles.datePlaceholder}>
                  {draft.birthday ? readableDate(draft.birthday) : 'Select your birthday (optional)'}
                </Text>
                <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} tintColor={OnboardingColors.leaf} size={20} />
              </TouchableOpacity>
              {showBirthdayPicker ? (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  presentation="dialog"
                  maximumDate={new Date()}
                  accentColor={OnboardingColors.forest}
                  positiveButton={{ label: 'Done' }}
                  negativeButton={{ label: 'Cancel' }}
                  onValueChange={(_event, date) => {
                    setField('birthday', localDateString(date));
                    setShowBirthdayPicker(false);
                  }}
                  onDismiss={() => setShowBirthdayPicker(false)}
                />
              ) : null}
            </View>

            <View style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Add Socials <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.socialField}>
                <SymbolView name={{ ios: 'briefcase', android: 'work', web: 'work' }} tintColor={OnboardingColors.leaf} size={19} />
                <View style={styles.socialInputWrap}>{renderField('LinkedIn', 'linkedin', 'Profile URL or username', { autoCapitalize: 'none' })}</View>
              </View>
              <View style={styles.socialField}>
                <SymbolView name={{ ios: 'at', android: 'alternate_email', web: 'alternate_email' }} tintColor={OnboardingColors.leaf} size={19} />
                <View style={styles.socialInputWrap}>{renderField('X (Twitter)', 'x', 'Profile URL or username', { autoCapitalize: 'none' })}</View>
              </View>
              <View style={styles.socialField}>
                <SymbolView name={{ ios: 'camera', android: 'camera_alt', web: 'camera_alt' }} tintColor={OnboardingColors.leaf} size={19} />
                <View style={styles.socialInputWrap}>{renderField('Instagram', 'instagram', 'Profile URL or username', { autoCapitalize: 'none' })}</View>
              </View>
            </View>

            {notice ? <InlineNotice message={notice} kind={notice.startsWith('Profile saved') ? 'info' : 'error'} /> : null}
            <View style={styles.saveButton}><ActionButton label={isSaving ? 'Saving…' : 'Save Profile'} disabled={isSaving || isLoading} onPress={saveProfile} /></View>
            <Text style={styles.requiredNote}>* Required fields</Text>
            <View style={styles.signOutButton}>
              <ActionButton label={isSigningOut ? 'Signing out…' : 'Sign Out'} variant="outlined" disabled={isSigningOut} onPress={signOut} />
            </View>
          </> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36, alignSelf: 'center', width: '100%', maxWidth: 560, gap: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  heading: { color: OnboardingColors.forest, fontSize: 17, fontWeight: '900', letterSpacing: 1.8 },
  headerSpacer: { width: 44 },
  overview: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, backgroundColor: OnboardingColors.panel, borderRadius: 20, borderWidth: 1, borderColor: OnboardingColors.border, marginBottom: 4 },
  avatar: { height: 66, width: 66, borderRadius: 33, backgroundColor: OnboardingColors.paleGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: OnboardingColors.border },
  avatarText: { color: OnboardingColors.forest, fontSize: 25, fontWeight: '800' },
  overviewText: { flex: 1, gap: 3 },
  overviewName: { color: OnboardingColors.forest, fontSize: 17, fontWeight: '800' },
  overviewUsername: { color: OnboardingColors.leaf, fontSize: 13, fontWeight: '700' },
  overviewEmail: { color: OnboardingColors.muted, fontSize: 12 },
  field: { width: '100%', gap: 7 },
  label: { color: OnboardingColors.forest, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderColor: OnboardingColors.border, borderRadius: 15, paddingHorizontal: 15, fontSize: 15, color: OnboardingColors.ink, backgroundColor: OnboardingColors.white },
  inputError: { borderColor: OnboardingColors.error },
  bioInput: { height: 128, paddingTop: 13, paddingBottom: 13 },
  counter: { color: OnboardingColors.muted, fontSize: 11, alignSelf: 'flex-end', marginTop: -3 },
  errorText: { color: OnboardingColors.error, fontSize: 12, lineHeight: 17 },
  helperText: { color: OnboardingColors.muted, fontSize: 11 },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactColumn: { flexDirection: 'column' },
  contactField: { flex: 1, minWidth: 0 },
  readOnlyInput: { backgroundColor: '#F1F4F0', color: OnboardingColors.muted },
  dateButton: { minHeight: 50, borderWidth: 1, borderColor: OnboardingColors.border, borderRadius: 15, paddingHorizontal: 15, backgroundColor: OnboardingColors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: OnboardingColors.ink, fontSize: 15 },
  datePlaceholder: { color: OnboardingColors.muted, fontSize: 14 },
  socialSection: { gap: 12, marginTop: 3 },
  sectionTitle: { color: OnboardingColors.forest, fontSize: 15, fontWeight: '800' },
  optional: { color: OnboardingColors.muted, fontSize: 12, fontWeight: '500' },
  socialField: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialInputWrap: { flex: 1 },
  saveButton: { marginTop: 2 },
  requiredNote: { textAlign: 'center', fontSize: 11, color: OnboardingColors.muted },
  signOutButton: { marginTop: 8 },
  status: { color: OnboardingColors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  loginPrompt: { gap: 14 },
});
