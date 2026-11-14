import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InlineNotice, OnboardingColors } from '@/components/onboarding-ui';
import { createPublicContribution } from '@/lib/contributions';
import { getSupabaseClient } from '@/lib/supabase';

const taskOptions = [
  'Planted a plant',
  'Watered plants',
  'Planted a tree',
  'Cleaned up litter',
  'Recycled waste',
  'Saved water',
  'Used public transport',
  'Write your own',
];
const customTaskOption = 'Write your own';
const descriptionLimit = 500;
const maximumPhotoSize = 10 * 1024 * 1024;

function submissionError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLowerCase();

  if (normalized.includes('contributions') && (normalized.includes('schema cache') || normalized.includes('does not exist') || normalized.includes('could not find the table'))) {
    return 'Public sharing is not configured yet. Apply the Supabase migration in supabase/migrations, then try again.';
  }
  if (normalized.includes('bucket') || normalized.includes('storage')) {
    return 'Photo storage is not ready. Apply the Supabase migration and try again.';
  }
  return message || 'Your contribution could not be shared. Check your connection and try again.';
}

export default function TasksScreen() {
  const { width } = useWindowDimensions();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const horizontalPadding = width < 360 ? 16 : 22;

  const choosePhoto = async () => {
    setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled) return;
      const nextPhoto = result.assets[0];
      if (!nextPhoto) return;
      if (nextPhoto.fileSize && nextPhoto.fileSize > maximumPhotoSize) {
        setNotice('Choose a photo smaller than 10 MB.');
        return;
      }
      setPhoto(nextPhoto);
    } catch {
      setNotice('The photo library could not be opened. Please try again.');
    }
  };

  const selectTask = (option: string) => {
    setIsPickerOpen(false);
    setNotice('');
    if (option === customTaskOption) {
      setSelectedTask(option);
      setIsCustomTask(true);
      setCustomTitle('');
      return;
    }
    setSelectedTask(option);
    setIsCustomTask(false);
    setCustomTitle('');
  };

  const shareContribution = async () => {
    const taskTitle = isCustomTask ? customTitle.trim() : selectedTask.trim();
    if (!photo) {
      setNotice('Add a photo of your contribution before sharing.');
      return;
    }
    if (!taskTitle || (isCustomTask && !customTitle.trim())) {
      setNotice('Choose an activity or enter a task title.');
      return;
    }

    setIsSubmitting(true);
    setNotice('');
    try {
      const { data: { user }, error } = await getSupabaseClient().auth.getUser();
      if (error || !user) throw new Error('Your sign-in session has expired. Please sign in again.');

      const metadata = user.user_metadata ?? {};
      const profileName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
      const username = typeof metadata.profile_username === 'string' ? metadata.profile_username.trim() : '';
      const emailName = user.email?.split('@')[0]?.trim() ?? '';
      const displayName = profileName || (username ? `@${username}` : '') || emailName || 'EcoEcho member';

      await createPublicContribution({
        userId: user.id,
        displayName,
        photo,
        taskTitle,
        description,
      });

      setPhoto(null);
      setSelectedTask('');
      setIsCustomTask(false);
      setCustomTitle('');
      setDescription('');
      Alert.alert(
        'Contribution shared',
        'Your contribution has been saved and added to the Community Feed.',
        [{ text: 'View Feed', onPress: () => router.navigate('/(tabs)/feed') }]
      );
    } catch (error) {
      setNotice(submissionError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>MY TASKS</Text>
              <Text style={styles.title}>Share a small win</Text>
              <Text style={styles.subtitle}>Your everyday actions can inspire others.</Text>
            </View>
            <View style={styles.headerIcon}>
              <SymbolView name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} tintColor={OnboardingColors.forest} size={24} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>A photo of your contribution <Text style={styles.required}>*</Text></Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photo ? 'Change contribution photo' : 'Choose a contribution photo'}
              onPress={() => void choosePhoto()}
              style={({ pressed }) => [styles.photoBox, pressed && styles.pressed]}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={styles.photoIcon}>
                    <SymbolView name={{ ios: 'camera', android: 'add_a_photo', web: 'add_a_photo' }} tintColor={OnboardingColors.forest} size={25} />
                  </View>
                  <Text style={styles.photoTitle}>Add a photo of your contribution</Text>
                  <Text style={styles.photoHint}>Choose an image from your gallery</Text>
                </View>
              )}
            </Pressable>
            {photo ? (
              <View style={styles.photoActions}>
                <Text numberOfLines={1} style={styles.photoFileName}>{photo.fileName || 'Selected photo'}</Text>
                <Pressable onPress={() => void choosePhoto()} accessibilityRole="button" accessibilityLabel="Change photo" style={styles.photoActionButton}>
                  <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} tintColor={OnboardingColors.leaf} size={16} />
                  <Text style={styles.photoActionText}>Change</Text>
                </Pressable>
                <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.photoActionButton}>
                  <SymbolView name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} tintColor={OnboardingColors.error} size={16} />
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>What did you do today? <Text style={styles.required}>*</Text></Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose a contribution activity"
              accessibilityState={{ expanded: isPickerOpen }}
              onPress={() => setIsPickerOpen((open) => !open)}
              style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
              <Text style={selectedTask ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {selectedTask || 'Choose an activity'}
              </Text>
              <SymbolView name={{ ios: isPickerOpen ? 'chevron.up' : 'chevron.down', android: isPickerOpen ? 'expand_less' : 'expand_more', web: isPickerOpen ? 'expand_less' : 'expand_more' }} tintColor={OnboardingColors.leaf} size={21} />
            </Pressable>

            {isPickerOpen ? (
              <View style={styles.optionsList}>
                {taskOptions.map((option, index) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: option === selectedTask }}
                    onPress={() => selectTask(option)}
                    style={({ pressed }) => [styles.option, index === taskOptions.length - 1 && styles.customOption, pressed && styles.pressed]}>
                    <Text style={[styles.optionText, option === selectedTask && styles.selectedOption]}>{option}</Text>
                    {option === selectedTask ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor={OnboardingColors.leaf} size={18} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {isCustomTask ? (
              <TextInput
                value={customTitle}
                onChangeText={(value) => { setCustomTitle(value.slice(0, 120)); setNotice(''); }}
                placeholder="Enter your task title"
                placeholderTextColor={OnboardingColors.muted}
                style={styles.input}
                maxLength={120}
                returnKeyType="next"
                accessibilityLabel="Custom task title"
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.label}>Tell us more <Text style={styles.optional}>(optional)</Text></Text>
              <Text style={styles.counter}>{description.length}/{descriptionLimit}</Text>
            </View>
            <TextInput
              value={description}
              onChangeText={(value) => { setDescription(value); setNotice(''); }}
              placeholder="Describe your contribution..."
              placeholderTextColor={OnboardingColors.muted}
              style={styles.descriptionInput}
              multiline
              maxLength={descriptionLimit}
              textAlignVertical="top"
              accessibilityLabel="Contribution description"
            />
          </View>

          <View style={styles.publicNote}>
            <SymbolView name={{ ios: 'globe.americas', android: 'public', web: 'public' }} tintColor={OnboardingColors.leaf} size={18} />
            <Text style={styles.publicNoteText}>Your photo and contribution will be visible in the public Community Feed.</Text>
          </View>

          {notice ? <InlineNotice message={notice} kind="error" /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => void shareContribution()}
            style={({ pressed }) => [styles.shareButton, isSubmitting && styles.disabledButton, pressed && !isSubmitting && styles.pressed]}>
            {isSubmitting ? <ActivityIndicator color={OnboardingColors.white} /> : <SymbolView name={{ ios: 'arrow.up.right', android: 'send', web: 'send' }} tintColor={OnboardingColors.white} size={18} />}
            <Text style={styles.shareButtonText}>{isSubmitting ? 'Sharing…' : 'Share in Public'}</Text>
          </Pressable>
          <Text style={styles.footerText}>Your contribution can encourage someone else to start.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OnboardingColors.panel },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingTop: 18, paddingBottom: 30, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 2 },
  eyebrow: { color: OnboardingColors.leaf, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 5 },
  title: { color: OnboardingColors.forest, fontSize: 25, lineHeight: 31, fontWeight: '800' },
  subtitle: { color: OnboardingColors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: OnboardingColors.paleGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: OnboardingColors.border },
  section: { gap: 9 },
  label: { color: OnboardingColors.forest, fontSize: 14, fontWeight: '800' },
  required: { color: OnboardingColors.leaf },
  optional: { color: OnboardingColors.muted, fontSize: 12, fontWeight: '500' },
  photoBox: { height: 204, borderWidth: 1.5, borderStyle: 'dashed', borderColor: OnboardingColors.border, borderRadius: 21, overflow: 'hidden', backgroundColor: '#F0F5EE' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  photoIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: OnboardingColors.paleGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  photoTitle: { color: OnboardingColors.forest, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  photoHint: { color: OnboardingColors.muted, fontSize: 12, marginTop: 5 },
  photoPreview: { width: '100%', height: '100%' },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
  photoFileName: { flex: 1, color: OnboardingColors.muted, fontSize: 11 },
  photoActionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5 },
  photoActionText: { color: OnboardingColors.leaf, fontSize: 11, fontWeight: '800' },
  removeText: { color: OnboardingColors.error, fontSize: 11, fontWeight: '800' },
  dropdown: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderWidth: 1, borderColor: OnboardingColors.border, borderRadius: 15, backgroundColor: OnboardingColors.white },
  dropdownValue: { color: OnboardingColors.ink, fontSize: 14, fontWeight: '600' },
  dropdownPlaceholder: { color: OnboardingColors.muted, fontSize: 14 },
  optionsList: { borderWidth: 1, borderColor: OnboardingColors.border, borderRadius: 15, backgroundColor: OnboardingColors.white, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E8EEE7' },
  customOption: { backgroundColor: '#F5F8F3', borderBottomWidth: 0 },
  optionText: { color: OnboardingColors.ink, fontSize: 13 },
  selectedOption: { color: OnboardingColors.forest, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: OnboardingColors.border, borderRadius: 15, backgroundColor: OnboardingColors.white, color: OnboardingColors.ink, fontSize: 14 },
  descriptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { color: OnboardingColors.muted, fontSize: 11 },
  descriptionInput: { minHeight: 116, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: OnboardingColors.border, borderRadius: 15, backgroundColor: OnboardingColors.white, color: OnboardingColors.ink, fontSize: 14, lineHeight: 20 },
  publicNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 15, backgroundColor: OnboardingColors.paleGreen },
  publicNoteText: { flex: 1, color: OnboardingColors.forest, fontSize: 12, lineHeight: 18 },
  shareButton: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 17, backgroundColor: OnboardingColors.forest, paddingHorizontal: 18, marginTop: 1 },
  shareButtonText: { color: OnboardingColors.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  disabledButton: { opacity: 0.6 },
  footerText: { color: OnboardingColors.muted, fontSize: 11, textAlign: 'center', marginTop: -11 },
  pressed: { opacity: 0.78 },
});
