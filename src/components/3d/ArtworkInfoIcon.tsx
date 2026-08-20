// The tappable "i" marker itself — positioned by the caller (GalleryScreen)
// using ArtworkIconProjector.tsx's screen-space projection. A gentle opacity
// pulse (RN's built-in Animated, no extra dependency) draws the eye to it
// without being distracting — client asked for "yanıp sönen" (blinking).
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';

const ICON_SIZE = 26;

interface ArtworkInfoIconProps {
  x: number;
  y: number;
  onPress: () => void;
  accessibilityLabel: string;
}

export default function ArtworkInfoIcon({ x, y, onPress, accessibilityLabel }: ArtworkInfoIconProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { left: x - ICON_SIZE / 2, top: y - ICON_SIZE / 2, opacity }]}
    >
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={styles.circle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={styles.letter}>i</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  circle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(20,16,10,0.85)',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
