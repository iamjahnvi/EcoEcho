import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { GoogleSignInAction } from '@/components/google-sign-in-action';
import { ActionButton, InlineNotice, OnboardingColors } from '@/components/onboarding-ui';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthLanding() {
  const theme = useTheme();
  const router = useRouter();
  const [notice, setNotice] = useState('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.leafMark}>❧</Text>
            </View>
            <Text style={[styles.brandName, { color: theme.text }]}>EcoEcho</Text>
          </View>

          <Image
            source={require('@/assets/images/forest-canopy.jpg')}
            contentFit="cover"
            accessibilityLabel="Sunlight filtering through a green forest"
            style={styles.heroImage}
          />

          <View style={styles.intro}>
            <Text style={[styles.headline, { color: theme.text }]}>Make a little change.{ '\n' }Leave a lasting echo.</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              A greener tomorrow starts with the choices we make today.
            </Text>
          </View>

          <View style={styles.loginPanel}>
            <Text style={styles.panelTitle}>GET STARTED</Text>
            <GoogleSignInAction onNotice={setNotice} />
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.separatorLine} />
            </View>
            <ActionButton
              label="Continue with Email"
              variant="outlined"
              onPress={() => router.push('/email')}
            />
            {notice ? <InlineNotice message={notice} /> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, flex: 1, justifyContent: 'center', gap: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 2 },
  brandMark: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: OnboardingColors.paleGreen, borderWidth: 1, borderColor: OnboardingColors.border },
  leafMark: { color: OnboardingColors.forest, fontSize: 28, lineHeight: 32, transform: [{ rotate: '-35deg' }] },
  brandName: { fontSize: 27, fontWeight: '800', letterSpacing: 0.4 },
  heroImage: { width: '100%', aspectRatio: 1.3, maxHeight: 340, borderRadius: 26, backgroundColor: OnboardingColors.paleGreen },
  intro: { gap: 7, alignItems: 'center' },
  headline: { fontSize: 25, lineHeight: 31, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 330 },
  loginPanel: { width: '100%', paddingHorizontal: 17, paddingVertical: 18, borderRadius: 24, borderWidth: 1, borderColor: OnboardingColors.border, backgroundColor: OnboardingColors.panel, gap: 12 },
  panelTitle: { color: OnboardingColors.forest, fontSize: 12, fontWeight: '800', letterSpacing: 1.7, textAlign: 'center', marginBottom: 1 },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  separatorLine: { flex: 1, height: 1, backgroundColor: OnboardingColors.border },
  separatorText: { color: OnboardingColors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
});
