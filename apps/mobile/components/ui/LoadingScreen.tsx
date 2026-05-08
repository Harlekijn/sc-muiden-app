import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Logo } from './Logo';

export function LoadingScreen() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide the fill from -48 (off left) to 120 (off right), then snap back
    Animated.loop(
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <Logo height={184} />
      </Animated.View>

      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { transform: [{ translateX: slideAnim }] }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#dde5f0',
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 48,
    borderRadius: 2,
    backgroundColor: '#046bba',
  },
});
