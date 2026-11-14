import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { InlineNotice, OnboardingColors } from '@/components/onboarding-ui';
import { useTheme } from '@/hooks/use-theme';

export function HomeDashboard() {
  const theme = useTheme();
  const [notice, setNotice] = useState('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View style={styles.statusBadges}>
            <View style={styles.statusBadge}>
              <SymbolView name={{ ios: 'circle.hexagongrid.fill', android: 'paid', web: 'paid' }} tintColor="#B7791F" size={18} />
              <View>
                <Text style={styles.badgeLabel}>Coins</Text>
                <Text style={styles.badgeValue}>—</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <SymbolView name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }} tintColor="#D47743" size={18} />
              <View>
                <Text style={styles.badgeLabel}>Streak</Text>
                <Text style={styles.badgeValue}>—</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leaderboard, coming soon"
            onPress={() => setNotice('Leaderboard is coming soon.')}
            style={({ pressed }) => [styles.leaderboardButton, pressed && styles.pressed]}
          >
            <SymbolView name={{ ios: 'trophy.fill', android: 'leaderboard', web: 'leaderboard' }} tintColor={OnboardingColors.forest} size={22} />
          </Pressable>
        </View>

        <View style={styles.welcomeCopy}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>WELCOME TO ECOECHO</Text>
          <Text style={[styles.title, { color: theme.text }]}>Make a little change.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Leave a lasting echo.</Text>
        </View>

        <ImageBackground
          source={require('@/assets/images/forest-canopy.jpg')}
          resizeMode="cover"
          accessibilityLabel="Sunlight filtering through a green forest"
          imageStyle={styles.heroImage}
          style={styles.hero}
        >
          <View style={styles.heroCaption}>
            <View style={styles.heroMark}>
              <SymbolView name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} tintColor={OnboardingColors.white} size={19} />
            </View>
            <Text style={styles.heroText}>A greener tomorrow starts with the choices we make today.</Text>
          </View>
        </ImageBackground>

        <View style={styles.challengeCard}>
          <View style={styles.challengeHeadingRow}>
            <View style={styles.challengeCopy}>
              <Text style={styles.challengeTitle}>Share the challenge</Text>
              <Text style={styles.challengeSubtitle}>Saving the planet feels better with your friends.</Text>
            </View>
            <View style={styles.rewardBadge}>
              <SymbolView name={{ ios: 'circle.hexagongrid.fill', android: 'paid', web: 'paid' }} tintColor="#A96C13" size={17} />
              <Text style={styles.rewardText}>Earn 50 coins</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setNotice('Sharing an invite will be available soon.')}
            style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
          >
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} tintColor={OnboardingColors.forest} size={19} />
            <Text style={styles.inviteText}>Invite friends</Text>
            <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor={OnboardingColors.forest} size={18} />
          </Pressable>
        </View>

        {notice ? <InlineNotice message={notice} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, gap: 19 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadges: { flexDirection: 'row', gap: 9 },
  statusBadge: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 17, backgroundColor: OnboardingColors.panel, borderWidth: 1, borderColor: OnboardingColors.border },
  badgeLabel: { color: OnboardingColors.muted, fontSize: 10, fontWeight: '600' },
  badgeValue: { color: OnboardingColors.forest, fontSize: 14, fontWeight: '800', marginTop: 1 },
  leaderboardButton: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: OnboardingColors.paleGreen, borderWidth: 1, borderColor: OnboardingColors.border },
  welcomeCopy: { gap: 3, paddingTop: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.7, fontWeight: '800' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  hero: { width: '100%', height: 242, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: OnboardingColors.paleGreen },
  heroImage: { borderRadius: 24 },
  heroCaption: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingVertical: 15, backgroundColor: 'rgba(25, 52, 34, 0.78)' },
  heroMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: OnboardingColors.leaf, alignItems: 'center', justifyContent: 'center' },
  heroText: { color: OnboardingColors.white, fontSize: 14, lineHeight: 19, fontWeight: '700', flex: 1 },
  challengeCard: { backgroundColor: OnboardingColors.white, borderRadius: 23, borderWidth: 1, borderColor: OnboardingColors.border, padding: 17, gap: 15, shadowColor: '#193A27', shadowOpacity: 0.06, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  challengeHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  challengeCopy: { flex: 1, gap: 5 },
  challengeTitle: { color: OnboardingColors.forest, fontSize: 18, fontWeight: '800' },
  challengeSubtitle: { color: OnboardingColors.muted, fontSize: 13, lineHeight: 19 },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFF3D9' },
  rewardText: { color: '#815311', fontSize: 11, fontWeight: '800' },
  inviteButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 15, backgroundColor: OnboardingColors.paleGreen, borderWidth: 1, borderColor: OnboardingColors.border },
  inviteText: { color: OnboardingColors.forest, fontSize: 14, fontWeight: '800', flex: 1 },
  pressed: { opacity: 0.72 },
});
