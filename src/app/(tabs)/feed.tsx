import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingColors } from '@/components/onboarding-ui';

type CommunityPost = {
  id: string;
  name: string;
  initials: string;
  time: string;
  topic: string;
  message: string;
  likes: number;
  comments: number;
  avatarColor: string;
};

const samplePosts: CommunityPost[] = [
  {
    id: '1',
    name: 'Maya Patel',
    initials: 'MP',
    time: '12 min ago',
    topic: 'LOW-WASTE LIVING',
    message: 'Swapped my usual takeaway cup for a reusable one this week. A small change, but it feels good to make it a habit. 🌱',
    likes: 18,
    comments: 4,
    avatarColor: '#DCE9D8',
  },
  {
    id: '2',
    name: 'Leo Chen',
    initials: 'LC',
    time: '38 min ago',
    topic: 'COMMUNITY GARDEN',
    message: 'Our neighborhood garden had its first harvest today. We have more tomatoes than we know what to do with — any favorite recipes?',
    likes: 32,
    comments: 9,
    avatarColor: '#F2E7D4',
  },
  {
    id: '3',
    name: 'Aisha Morgan',
    initials: 'AM',
    time: '1 hour ago',
    topic: 'GETTING AROUND',
    message: 'Took the longer, tree-lined route to work by bike today. Fresh air before the first meeting made all the difference.',
    likes: 24,
    comments: 6,
    avatarColor: '#E9DFF0',
  },
  {
    id: '4',
    name: 'Noah Williams',
    initials: 'NW',
    time: '2 hours ago',
    topic: 'ECO TIPS',
    message: 'A reminder to check your local library before buying a book you only need once. Mine also lends out tools and board games!',
    likes: 41,
    comments: 12,
    avatarColor: '#DDE9EF',
  },
  {
    id: '5',
    name: 'Priya Shah',
    initials: 'PS',
    time: '3 hours ago',
    topic: 'DAILY WINS',
    message: 'Started keeping a small container in my bag for market snacks. No packaging, and I get to support the local growers nearby.',
    likes: 15,
    comments: 3,
    avatarColor: '#F3E2D9',
  },
];

export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const horizontalPadding = width < 360 ? 16 : 22;

  const renderPost: ListRenderItem<CommunityPost> = ({ item }) => {
    const isLiked = likedPosts[item.id] ?? false;

    return (
      <View style={styles.postRow}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>

        <View style={styles.postColumn}>
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.authorBlock}>
                <Text style={styles.authorName}>{item.name}</Text>
                <Text style={styles.postTime}>{item.time}</Text>
              </View>
              <View style={styles.topicPill}>
                <Text style={styles.topicText}>{item.topic}</Text>
              </View>
            </View>

            <Text style={styles.postMessage}>{item.message}</Text>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${isLiked ? 'Unlike' : 'Like'} ${item.name}'s sample post`}
                accessibilityState={{ selected: isLiked }}
                onPress={() => setLikedPosts((current) => ({ ...current, [item.id]: !isLiked }))}
                style={({ pressed }) => [styles.likeButton, pressed && styles.pressed]}>
                <SymbolView
                  name={{ ios: isLiked ? 'heart.fill' : 'heart', android: isLiked ? 'favorite' : 'favorite_border', web: isLiked ? 'favorite' : 'favorite_border' }}
                  tintColor={isLiked ? OnboardingColors.leaf : OnboardingColors.muted}
                  size={19}
                />
                <Text style={[styles.actionLabel, isLiked && styles.likedLabel]}>
                  {item.likes + Number(isLiked)}
                </Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <View style={styles.commentsCount}>
                <SymbolView
                  name={{ ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
                  tintColor={OnboardingColors.leaf}
                  size={18}
                />
                <Text style={styles.actionLabel}>{item.comments} comments</Text>
              </View>
            </View>
          </View>

          <View style={styles.commentPreview}>
            <View style={styles.commentStem} />
            <View style={styles.commentMessage}>
              <Text style={styles.commentHeading}>JOIN THE CONVERSATION</Text>
              <Text style={styles.commentHint}>Comments aren’t connected yet.</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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
        data={samplePosts}
        renderItem={renderPost}
        keyExtractor={(post) => post.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPadding }]}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Growing together</Text>
            <Text style={styles.introBody}>Small steps add up. Share ideas and celebrate the everyday wins.</Text>
            <View style={styles.sampleBadge}>
              <View style={styles.sampleDot} />
              <Text style={styles.sampleText}>SAMPLE COMMUNITY POSTS · LIKES ARE PREVIEW-ONLY</Text>
            </View>
          </View>
        }
        ListFooterComponent={<Text style={styles.footerNote}>You’re all caught up 🌿</Text>}
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OnboardingColors.panel },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: OnboardingColors.panel },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: OnboardingColors.forest, fontSize: 15, fontWeight: '900', letterSpacing: 2.1 },
  headerSpacer: { width: 44 },
  listContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 8, paddingBottom: 28 },
  intro: { paddingTop: 10, paddingBottom: 22 },
  introTitle: { color: OnboardingColors.forest, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  introBody: { color: OnboardingColors.muted, fontSize: 14, lineHeight: 21, marginTop: 5, maxWidth: 480 },
  sampleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, marginTop: 15, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: OnboardingColors.paleGreen },
  sampleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: OnboardingColors.leaf },
  sampleText: { color: OnboardingColors.leaf, fontSize: 9, letterSpacing: 0.65, fontWeight: '800' },
  postRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: OnboardingColors.border, marginTop: 4 },
  avatarText: { color: OnboardingColors.forest, fontSize: 12, fontWeight: '800' },
  postColumn: { flex: 1, minWidth: 0 },
  postCard: { backgroundColor: OnboardingColors.white, borderColor: OnboardingColors.border, borderWidth: 1, borderRadius: 20, padding: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  authorBlock: { flex: 1, minWidth: 0, gap: 2 },
  authorName: { color: OnboardingColors.forest, fontSize: 14, fontWeight: '800' },
  postTime: { color: OnboardingColors.muted, fontSize: 11 },
  topicPill: { maxWidth: '52%', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 9, backgroundColor: OnboardingColors.paleGreen },
  topicText: { color: OnboardingColors.leaf, fontSize: 8, letterSpacing: 0.45, fontWeight: '800' },
  postMessage: { color: OnboardingColors.ink, fontSize: 14, lineHeight: 21, marginTop: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E8EEE7', marginTop: 15, paddingTop: 11 },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingRight: 12, minHeight: 34 },
  likedLabel: { color: OnboardingColors.leaf },
  actionDivider: { width: 1, height: 18, backgroundColor: OnboardingColors.border, marginHorizontal: 5 },
  commentsCount: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 7, minHeight: 34 },
  actionLabel: { color: OnboardingColors.muted, fontSize: 12, fontWeight: '700' },
  commentPreview: { flexDirection: 'row', alignItems: 'stretch', marginTop: 4, minHeight: 48 },
  commentStem: { width: 2, borderRadius: 1, backgroundColor: OnboardingColors.border, marginLeft: 10, marginRight: 13 },
  commentMessage: { flex: 1, justifyContent: 'center', paddingVertical: 7 },
  commentHeading: { color: OnboardingColors.leaf, fontSize: 9, letterSpacing: 0.75, fontWeight: '800' },
  commentHint: { color: OnboardingColors.muted, fontSize: 12, marginTop: 3 },
  postSeparator: { height: 17 },
  footerNote: { textAlign: 'center', color: OnboardingColors.muted, fontSize: 12, paddingTop: 12, paddingBottom: 6 },
  pressed: { opacity: 0.68 },
});
