// Native equivalent of vea-frontend/src/components/3d/Player.tsx. Same
// per-axis (slide) AABB collision against layout.colliders and the same
// EYE_HEIGHT-locked camera, but the input source is touch (see
// TouchControls.tsx's joystick + drag-look) instead of PointerLockControls +
// WASD — mobile has no mouse/keyboard, see CLAUDE.md's "Kontroller — web'den
// sapma" note.
//
// Per-artwork info used to surface automatically on proximity — client
// feedback (2026-08-20) changed this to a tap-triggered "i" icon per
// painting instead (see ArtworkIconProjector.tsx), so that logic was removed
// from here rather than left dead.
import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EYE_HEIGHT, PLAYER_RADIUS, type ColliderBox } from '../../lib/gallery/galleryLayout';
import { useExhibition } from './ExhibitionContext';

// Web's Player.tsx uses 3.6 (m/s), but that's driven by binary WASD
// key-down/up; the joystick gives a continuous analog push that players
// tend to hold at full tilt, which read as noticeably too fast on a real
// device (client feedback, 2026-08-20) — slowed down for touch input.
const WALK_SPEED = 1.8;
const LOOK_SENSITIVITY = 0.006; // radians per drag pixel
const MAX_PITCH = 1.3; // radians, clear of straight up/down

/** Continuous joystick offset (each axis in [-1, 1]) + accumulated look-drag delta (pixels, consumed/reset every frame) — written by TouchControls.tsx, read here. A ref (not props) so overlay touch handlers never trigger a React re-render on every move sample. */
export interface TouchControlState {
  move: { x: number; y: number };
  look: { dx: number; dy: number };
}

interface TouchPlayerProps {
  controlState: RefObject<TouchControlState>;
}

export default function TouchPlayer({ controlState }: TouchPlayerProps) {
  const { camera } = useThree();
  const { layout } = useExhibition();
  const yaw = useRef(layout.playerStartYaw);
  const pitch = useRef(0);
  const forwardDir = useRef(new THREE.Vector3());
  const rightDir = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(...layout.playerStart);
    yaw.current = layout.playerStartYaw;
    pitch.current = 0;
    camera.rotation.set(0, layout.playerStartYaw, 0, 'YXZ');
  }, [camera, layout.playerStart, layout.playerStartYaw]);

  useFrame((_, delta) => {
    const state = controlState.current;
    if (!state) return;
    const { move, look } = state;

    if (look.dx !== 0 || look.dy !== 0) {
      yaw.current -= look.dx * LOOK_SENSITIVITY;
      pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current - look.dy * LOOK_SENSITIVITY));
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
      look.dx = 0;
      look.dy = 0;
    }

    if (move.x !== 0 || move.y !== 0) {
      camera.getWorldDirection(forwardDir.current);
      forwardDir.current.y = 0;
      forwardDir.current.normalize();
      rightDir.current.set(-forwardDir.current.z, 0, forwardDir.current.x);

      const moveStep = WALK_SPEED * Math.min(delta, 0.05);
      // joystick +y (pushed up) = walk forward; +x = strafe right.
      const dx = (forwardDir.current.x * move.y + rightDir.current.x * move.x) * moveStep;
      const dz = (forwardDir.current.z * move.y + rightDir.current.z * move.x) * moveStep;

      const pos = camera.position;
      if (dx !== 0 && !collides(pos.x + dx, pos.z, layout.colliders)) pos.x += dx;
      if (dz !== 0 && !collides(pos.x, pos.z + dz, layout.colliders)) pos.z += dz;
      pos.y = EYE_HEIGHT;
    }
  });

  return null;
}

function collides(x: number, z: number, colliders: ColliderBox[]): boolean {
  const r = PLAYER_RADIUS;
  for (const box of colliders) {
    if (x + r > box.minX && x - r < box.maxX && z + r > box.minZ && z - r < box.maxZ) {
      return true;
    }
  }
  return false;
}
