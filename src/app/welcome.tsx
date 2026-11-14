import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, OnboardingColors } from '@/components/onboarding-ui';

export default function WelcomeScreen() {
  const [growth] = useState(() => new Animated.Value(0.65));
  const [sway] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    Animated.spring(growth, { toValue: 1, damping: 10, stiffness: 90, useNativeDriver: true }).start();
    animation.start();
    return () => animation.stop();
  }, [growth, sway]);

  const leafRotation = sway.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.message}>
          <Text style={styles.eyebrow}>WELCOME TO ECOECHO</Text>
          <Text style={styles.title}>Your greener journey starts here.</Text>
          <Text style={styles.subtitle}>Small choices can grow into lasting change.</Text>
        </View>

        <View style={styles.plantArea} accessibilityLabel="A growing green plant" accessible>
          <View style={styles.sun} />
          <Animated.View style={[styles.plant, { transform: [{ scale: growth }] }]}>
            <Animated.Text style={[styles.leafLeft, { transform: [{ rotate: leafRotation }] }]}>🌿</Animated.Text>
            <Text style={styles.sprout}>🌱</Text>
            <Animated.Text style={[styles.leafRight, { transform: [{ rotate: leafRotation }] }]}>🍃</Animated.Text>
          </Animated.View>
          <View style={styles.soil} />
          <Text style={styles.plantCaption}>One step at a time</Text>
        </View>

        <View style={styles.cta}>
          <ActionButton label="Let's Go" onPress={() => router.replace('/(tabs)/profile')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF6' },
  content: { flex: 1, paddingHorizontal: 26, paddingTop: 32, paddingBottom: 24, justifyContent: 'space-between' },
  message: { alignItems: 'center', gap: 12, paddingTop: 16 },
  eyebrow: { color: OnboardingColors.leaf, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: OnboardingColors.forest, fontSize: 30, lineHeight: 37, fontWeight: '800', textAlign: 'center', maxWidth: 360 },
  subtitle: { color: OnboardingColors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 300 },
  plantArea: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sun: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#EAF2E8', top: '23%' },
  plant: { height: 200, width: 230, alignItems: 'center', justifyContent: 'flex-end' },
  sprout: { fontSize: 96, zIndex: 1 },
  leafLeft: { position: 'absolute', fontSize: 48, left: 24, bottom: 62 },
  leafRight: { position: 'absolute', fontSize: 43, right: 27, bottom: 84 },
  soil: { height: 12, width: 180, borderRadius: 20, backgroundColor: '#CBA77A', marginTop: -3 },
  plantCaption: { color: OnboardingColors.muted, fontSize: 13, marginTop: 18 },
  cta: { width: '100%', paddingBottom: 8 },
});
