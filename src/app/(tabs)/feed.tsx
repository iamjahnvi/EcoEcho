import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingColors } from '@/components/onboarding-ui';

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <SymbolView name={{ ios: 'text.bubble', android: 'dynamic_feed', web: 'dynamic_feed' }} tintColor={OnboardingColors.forest} size={30} />
        </View>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>Community updates will appear here.</Text>
        <Text style={styles.note}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF6' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  iconCircle: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: OnboardingColors.paleGreen, borderWidth: 1, borderColor: OnboardingColors.border, marginBottom: 4 },
  title: { color: OnboardingColors.forest, fontSize: 24, fontWeight: '800' },
  subtitle: { color: OnboardingColors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  note: { color: OnboardingColors.leaf, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginTop: 7 },
});
