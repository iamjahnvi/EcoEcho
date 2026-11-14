import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingColors } from '@/components/onboarding-ui';
import { getPublicContributions, type PublicContribution } from '@/lib/contributions';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'E';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const [posts, setPosts] = useState<PublicContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const horizontalPadding = width < 360 ? 16 : 22;

  const loadPosts = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      setPosts(await getPublicContributions());
    } catch {
      setError('Community posts could not be loaded. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void getPublicContributions()
        .then((nextPosts) => {
          if (isActive) {
            setPosts(nextPosts);
            setError('');
          }
        })
        .catch(() => {
          if (isActive) setError('Community posts could not be loaded. Check your connection and try again.');
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const renderPost: ListRenderItem<PublicContribution> = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(item.displayName)}</Text>
        </View>
        <View style={styles.authorBlock}>
          <Text style={styles.authorName}>{item.displayName}</Text>
          <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <SymbolView name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} tintColor={OnboardingColors.leaf} size={20} />
      </View>

      <Text style={styles.taskTitle}>{item.taskTitle}</Text>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      <Image source={{ uri: item.photoUrl }} style={styles.photo} resizeMode="cover" />
    </View>
  );

  const emptyContent = isLoading ? (
    <View style={styles.emptyState}>
      <ActivityIndicator color={OnboardingColors.forest} />
      <Text style={styles.emptyText}>Loading community contributions…</Text>
    </View>
  ) : error ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>We couldn’t reach the community</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <Pressable onPress={() => void loadPosts()} style={styles.retryButton} accessibilityRole="button">
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={OnboardingColors.forest} size={29} />
      </View>
      <Text style={styles.emptyTitle}>A fresh start</Text>
      <Text style={styles.emptyText}>No contributions yet. Share your first small step from My Tasks.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={() => router.replace('/(tabs)/home')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={OnboardingColors.forest} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>COMMUNITY</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(post) => post.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPadding }, posts.length === 0 && styles.emptyList]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadPosts(true)}
            tintColor={OnboardingColors.forest}
            colors={[OnboardingColors.forest]}
          />
        }
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Growing together</Text>
            <Text style={styles.introBody}>Small steps add up. See the positive changes your community is making.</Text>
          </View>
        }
        ListEmptyComponent={emptyContent}
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OnboardingColors.panel },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: OnboardingColors.forest, fontSize: 15, fontWeight: '900', letterSpacing: 2.1 },
  headerSpacer: { width: 44 },
  listContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 8, paddingBottom: 28 },
  emptyList: { flexGrow: 1 },
  intro: { paddingTop: 10, paddingBottom: 22 },
  introTitle: { color: OnboardingColors.forest, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  introBody: { color: OnboardingColors.muted, fontSize: 14, lineHeight: 21, marginTop: 5, maxWidth: 480 },
  postCard: { backgroundColor: OnboardingColors.white, borderColor: OnboardingColors.border, borderWidth: 1, borderRadius: 20, padding: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: OnboardingColors.border, backgroundColor: OnboardingColors.paleGreen },
  avatarText: { color: OnboardingColors.forest, fontSize: 12, fontWeight: '800' },
  authorBlock: { flex: 1, minWidth: 0, gap: 2 },
  authorName: { color: OnboardingColors.forest, fontSize: 14, fontWeight: '800' },
  postTime: { color: OnboardingColors.muted, fontSize: 11 },
  taskTitle: { color: OnboardingColors.forest, fontSize: 17, lineHeight: 23, fontWeight: '800', marginTop: 15 },
  description: { color: OnboardingColors.ink, fontSize: 14, lineHeight: 21, marginTop: 6 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 15, backgroundColor: OnboardingColors.paleGreen, marginTop: 13 },
  postSeparator: { height: 15 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 11 },
  emptyIcon: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: OnboardingColors.paleGreen, borderWidth: 1, borderColor: OnboardingColors.border, marginBottom: 3 },
  emptyTitle: { color: OnboardingColors.forest, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: OnboardingColors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 320 },
  retryButton: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: OnboardingColors.forest, borderRadius: 14, marginTop: 5 },
  retryText: { color: OnboardingColors.white, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
