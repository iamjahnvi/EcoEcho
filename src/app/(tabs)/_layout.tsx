import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { OnboardingColors } from '@/components/onboarding-ui';
import { useAuthSession } from '@/contexts/auth-session-context';

export const unstable_settings = {
  initialRouteName: 'home',
};

export default function TabsLayout() {
  const { session, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <View style={styles.loader}><ActivityIndicator size="small" color={OnboardingColors.forest} /></View>
      </SafeAreaView>
    );
  }

  if (!session) return <Redirect href="/auth" />;
  return <AppTabs />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: OnboardingColors.panel },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
