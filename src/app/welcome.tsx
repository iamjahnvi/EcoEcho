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

        <View style={styles.plantArea} accessibilityLabel="A cheerful green plant growing in a flower pot" accessible>
          <View style={styles.sun} />
          <Animated.View style={[styles.plant, { transform: [{ scale: growth }] }]}>
            <Animated.View style={[styles.leaf, styles.leafFarLeft, { transform: [{ rotate: leafRotation }] }]} />
            <View style={[styles.leaf, styles.leafLeft]} />
            <View style={[styles.leaf, styles.leafCenter]} />
            <View style={[styles.leaf, styles.leafRight]} />
            <Animated.View style={[styles.leaf, styles.leafFarRight, { transform: [{ rotate: leafRotation }] }]} />
            <View style={styles.potBody}>
              <View style={styles.face}>
                <View style={styles.eye} />
                <View style={styles.cheek} />
                <Text style={styles.smile}>?</Text>
                <View style={styles.cheek} />
                <View style={styles.eye} />
              </View>
            </View>
            <View style={styles.potRim} />
          </Animated.View>
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
  plantArea: { flex: 1, minHeight: 340, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sun: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: '#EAF2E8' },
  plant: { height: 330, width: 300, alignItems: 'center', justifyContent: 'flex-end' },
  leaf: { position: 'absolute', width: 70, height: 145, borderRadius: 70, backgroundColor: '#587550', borderWidth: 1.5, borderColor: '#26392A', bottom: 143 },
  leafFarLeft: { left: 26, bottom: 148, width: 62, height: 118, backgroundColor: '#63865B', transform: [{ rotate: '-57deg' }] },
  leafLeft: { left: 50, bottom: 150, transform: [{ rotate: '-34deg' }] },
  leafCenter: { width: 78, height: 162, bottom: 143, zIndex: 1, backgroundColor: '#4B6848' },
  leafRight: { right: 50, bottom: 150, transform: [{ rotate: '34deg' }] },
  leafFarRight: { right: 26, bottom: 148, width: 62, height: 118, backgroundColor: '#63865B', transform: [{ rotate: '57deg' }] },
  potBody: { position: 'absolute', bottom: 4, width: 206, height: 158, borderWidth: 2, borderColor: '#30291F', borderBottomLeftRadius: 17, borderBottomRightRadius: 17, backgroundColor: '#E8AA72', alignItems: 'center', justifyContent: 'center' },
  potRim: { position: 'absolute', bottom: 126, width: 264, height: 42, borderWidth: 2, borderColor: '#30291F', borderRadius: 9, backgroundColor: '#F4C18E', zIndex: 2 },
  face: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 28 },
  eye: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#171713' },
  cheek: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#F28E91' },
  smile: { color: '#171713', fontSize: 36, lineHeight: 38, fontWeight: '700', marginTop: -9, marginHorizontal: -3 },
  plantCaption: { color: OnboardingColors.muted, fontSize: 13, marginTop: 18 },
  cta: { width: '100%', paddingBottom: 8 },
});
