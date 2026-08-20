import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useExhibition } from '../lib/api/domains/exhibitions';
import { adaptApiExhibition } from '../lib/gallery/backendAdapter';
import { buildRoomLayout } from '../lib/gallery/galleryLayout';
import { ExhibitionProvider } from '../components/3d/ExhibitionContext';
import Gallery from '../components/3d/Gallery';
import TouchPlayer, { type TouchControlState } from '../components/3d/TouchPlayer';
import TouchControls from '../components/3d/TouchControls';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

/**
 * Faz 3b: the real native-rendered 3D gallery, backend-driven — mirrors web's
 * Scene.tsx composition (ExhibitionProvider + Gallery + a first-person
 * controller) minus what native can't do yet: no @react-three/drei
 * (PerformanceMonitor's adaptive dpr, EffectComposer/Bloom/Vignette
 * post-processing) — see CLAUDE.md's dependency table. `shadows` is left off
 * the Canvas for now (each mesh already sets cast/receiveShadow so it's a
 * one-line toggle later) pending a real-device FPS check, consistent with
 * this project's performance-first rule — don't guess at a mobile GPU's
 * shadow-map budget before measuring one.
 */
export function GalleryScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { exhibitionId } = route.params;
  const { data, isLoading } = useExhibition(exhibitionId);

  const exhibition = useMemo(() => (data ? adaptApiExhibition(data) : null), [data]);
  const layout = useMemo(
    () =>
      exhibition
        ? (exhibition.customLayout ?? buildRoomLayout(exhibition.roomSize ?? [10, 10], exhibition.wallHeight))
        : null,
    [exhibition]
  );

  // The gallery is meaningfully more usable in landscape (wider FOV, room
  // for the joystick/look-pad split either side of the frame) — lock it on
  // entry, restore the app-wide portrait lock (set in App.tsx) on exit so
  // the rest of the app (list screens, forms) stays portrait-only. app.json's
  // "orientation" is "default" (not "portrait") specifically so this native
  // shell-level lock is actually overridable at runtime here.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Full-screen/immersive: the walkable room should fill the entire panel,
  // not share it with the OS status bar and (on Android) the on-screen nav
  // bar — both were visible in an early device test and made the 3D view
  // feel like a cropped strip rather than a real space. `setBehaviorAsync`
  // makes the Android bars swipe-revealable instead of gone-for-good, so a
  // stray edge swipe doesn't strand the user with no way back to them.
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible');
      }
    };
  }, []);

  const controlState = useRef<TouchControlState>({ move: { x: 0, y: 0 }, look: { dx: 0, dy: 0 } });
  const [nearestArtworkId, setNearestArtworkId] = useState<string | null>(null);
  const nearestArtwork = useMemo(
    () => exhibition?.artworks?.find((a) => a.id === nearestArtworkId) ?? null,
    [exhibition, nearestArtworkId]
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!exhibition || !layout) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>{t('galleryUnavailable')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Canvas
        dpr={1}
        camera={{ fov: 65, near: 0.1, far: 100, position: layout.playerStart }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          scene.fog = new THREE.Fog(exhibition.theme.fogColor, 14, 40);
        }}
      >
        <color attach="background" args={[exhibition.theme.backgroundColor]} />
        <ExhibitionProvider exhibition={exhibition} layout={layout}>
          <Gallery />
          <TouchPlayer controlState={controlState} onNearestArtworkChange={setNearestArtworkId} />
        </ExhibitionProvider>
      </Canvas>

      <TouchControls controlState={controlState} />

      {/* Small floating control, not a chrome bar — the room should read as
          full-screen. No title text either (see exhibition.name removal):
          it duplicated what the info card already shows once you're near a
          wall, and permanent on-screen text worked against the "just the
          room" ask this replaced a taller opaque header bar for. */}
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
        <Text style={styles.backButtonText}>{t('galleryBack')}</Text>
      </Pressable>

      {nearestArtwork && (
        <View pointerEvents="none" style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>{nearestArtwork.title}</Text>
          <Text style={styles.infoCardSubtitle}>
            {nearestArtwork.year ? `${nearestArtwork.artist}, ${nearestArtwork.year}` : nearestArtwork.artist}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f1610' },
  centerText: { color: '#e9dcc2' },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: 'rgba(247,246,242,0.95)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  infoCardTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '600' },
  infoCardSubtitle: { color: '#5a5a5a', fontSize: 13, marginTop: 2 },
});
