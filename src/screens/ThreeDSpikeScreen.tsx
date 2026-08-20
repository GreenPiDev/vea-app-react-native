import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

/**
 * Faz 2 spike — proves the native render chain (expo-gl + @react-three/
 * fiber, no web/WebView involved) actually works before building the real
 * gallery on top of it (Faz 3). One rotating cube in a single scene + a
 * live FPS counter, nothing backend-related. See vea-app-react-native/
 * CLAUDE.md "3D sahne" section for why native R3F was chosen over a
 * WebView wrapping vea-frontend's scene.
 *
 * Not reachable from normal navigation yet (dev-only entry point) — no
 * simulator was available to run this on at the time it was written, see
 * the CLAUDE.md note this phase adds. Whoever runs it on a real iOS/
 * Android device next should check the FPS counter stays close to 60
 * before treating this phase as verified.
 */
function SpinningCube() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.6;
    meshRef.current.rotation.y += delta * 0.9;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#7d5636" />
    </mesh>
  );
}

function FpsProbe({ onSample }: { onSample: (fps: number) => void }) {
  const frames = useRef(0);
  const lastSample = useRef(Date.now());

  useFrame(() => {
    frames.current += 1;
    const now = Date.now();
    const elapsed = now - lastSample.current;
    if (elapsed >= 500) {
      onSample(Math.round((frames.current * 1000) / elapsed));
      frames.current = 0;
      lastSample.current = now;
    }
  });

  return null;
}

export function ThreeDSpikeScreen() {
  const [fps, setFps] = useState(0);

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, 1, 3], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.2} />
        <SpinningCube />
        <FpsProbe onSample={setFps} />
      </Canvas>
      <View pointerEvents="none" style={styles.overlay}>
        <Text style={styles.overlayText}>{fps} fps</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1610',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  overlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
