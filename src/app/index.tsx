import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingColors } from '@/components/onboarding-ui';
import { useAuthSession } from '@/contexts/auth-session-context';

export default function EntryRoute() {
  const { session, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}><ActivityIndicator size="small" color={OnboardingColors.forest} /></View>
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? '/(tabs)' : '/auth/index'} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OnboardingColors.panel },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
