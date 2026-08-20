// Lives inside the Canvas (needs camera/frame access, which only exists in
// the R3F render tree) and projects each artwork's top-right corner into 2D
// screen coordinates every frame, so screens/GalleryScreen.tsx can draw a
// real RN <Pressable> "i" icon there — client feedback (2026-08-20) wants a
// tappable info icon per painting instead of the earlier proximity-triggered
// auto-popup. RN Views can't live inside the Canvas tree itself (native R3F
// renders to a GL surface, not the RN view hierarchy), hence projecting to
// screen space and rendering the icons as a sibling overlay instead.
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useExhibition } from './ExhibitionContext';

export interface ArtworkIconPosition {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

/** How far off-screen (px) an icon may project before we stop rendering it — avoids a jarring pop at the exact viewport edge. */
const OFFSCREEN_MARGIN = 40;
/** Recomputed at ~10Hz, not every frame — icon markers don't need 60fps tracking precision, and this keeps the RN overlay's re-render rate cheap. */
const UPDATE_INTERVAL = 0.1;
/** Floor-plane distance (meters) the player must be within for a painting's icon to appear — client feedback (2026-08-20): icons should only show up in front of the actual painting, not for every painting visible anywhere in the room. */
const APPEAR_RADIUS = 3.5;

export default function ArtworkIconProjector({
  onPositionsChange,
}: {
  onPositionsChange: (positions: ArtworkIconPosition[]) => void;
}) {
  const { camera, size } = useThree();
  const { exhibition } = useExhibition();
  const lastUpdate = useRef(0);
  const vector = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastUpdate.current < UPDATE_INTERVAL) return;
    lastUpdate.current = clock.elapsedTime;

    const artworks = exhibition.artworks ?? [];
    const positions: ArtworkIconPosition[] = artworks.map((artwork) => {
      const width = artwork.height * artwork.aspect;
      // Painting-local "right" and "up" directions in world space, derived
      // from rotationY the same way ArtworkLight's normal vector is (see
      // Artwork.tsx) — right = (cos, 0, -sin) is 90° from the front normal
      // (sin, 0, cos), consistent with this codebase's rotationY convention
      // (0 = +Z normal, PI/2 = +X normal).
      const cos = Math.cos(artwork.rotationY);
      const sin = Math.sin(artwork.rotationY);
      const marginX = width / 2 + 0.08;
      const marginY = artwork.height / 2 + 0.08;

      const dx = camera.position.x - artwork.position[0];
      const dz = camera.position.z - artwork.position[2];
      const nearEnough = dx * dx + dz * dz <= APPEAR_RADIUS * APPEAR_RADIUS;

      vector.current.set(
        artwork.position[0] + cos * marginX,
        artwork.position[1] + marginY,
        artwork.position[2] - sin * marginX
      );
      vector.current.project(camera);

      const behindCamera = vector.current.z > 1;
      const x = (vector.current.x * 0.5 + 0.5) * size.width;
      const y = (-vector.current.y * 0.5 + 0.5) * size.height;
      const onScreen =
        x > -OFFSCREEN_MARGIN &&
        x < size.width + OFFSCREEN_MARGIN &&
        y > -OFFSCREEN_MARGIN &&
        y < size.height + OFFSCREEN_MARGIN;

      return { id: artwork.id, x, y, visible: nearEnough && !behindCamera && onScreen };
    });

    onPositionsChange(positions);
  });

  return null;
}
