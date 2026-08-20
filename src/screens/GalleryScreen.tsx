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
import ArtworkIconProjector, { type ArtworkIconPosition } from '../components/3d/ArtworkIconProjector';
import ArtworkInfoIcon from '../components/3d/ArtworkInfoIcon';

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

  // Tap-triggered info, not proximity-triggered (client feedback,
  // 2026-08-20): each painting gets a blinking "i" icon (projected to
  // screen space every ~100ms by ArtworkIconProjector, which lives inside
  // the Canvas since it needs camera access); tapping one opens the info
  // card below, tapping the same icon again (or the card's close button)
  // closes it.
  const [iconPositions, setIconPositions] = useState<ArtworkIconPosition[]>([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const selectedArtwork = useMemo(
    () => exhibition?.artworks?.find((a) => a.id === selectedArtworkId) ?? null,
    [exhibition, selectedArtworkId]
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
          <TouchPlayer controlState={controlState} />
          <ArtworkIconProjector onPositionsChange={setIconPositions} />
        </ExhibitionProvider>
      </Canvas>

      <TouchControls controlState={controlState} />

      {iconPositions
        .filter((p) => p.visible)
        .map((p) => (
          <ArtworkInfoIcon
            key={p.id}
            x={p.x}
            y={p.y}
            accessibilityLabel={t('artworkInfoIconLabel')}
            onPress={() => setSelectedArtworkId((current) => (current === p.id ? null : p.id))}
          />
        ))}

      {/* Small floating control, not a chrome bar — the room should read as
          full-screen. No title text either (see exhibition.name removal):
          it duplicated what the info card already shows once you're near a
          wall, and permanent on-screen text worked against the "just the
          room" ask this replaced a taller opaque header bar for. */}
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
        <Text style={styles.backButtonText}>{t('galleryBack')}</Text>
      </Pressable>

      {selectedArtwork && (
        <View style={styles.infoCard}>
          <View style={styles.infoCardText}>
            <Text style={styles.infoCardTitle}>{selectedArtwork.title}</Text>
            <Text style={styles.infoCardSubtitle}>
              {selectedArtwork.year ? `${selectedArtwork.artist}, ${selectedArtwork.year}` : selectedArtwork.artist}
            </Text>
          </View>
          <Pressable onPress={() => setSelectedArtworkId(null)} hitSlop={10}>
            <Text style={styles.infoCardClose}>×</Text>
          </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(247,246,242,0.95)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  infoCardText: { flex: 1 },
  infoCardTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '600' },
  infoCardSubtitle: { color: '#5a5a5a', fontSize: 13, marginTop: 2 },
  infoCardClose: { color: '#5a5a5a', fontSize: 22, lineHeight: 22, paddingHorizontal: 4 },
});
