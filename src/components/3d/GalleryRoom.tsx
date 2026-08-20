// Mirrors vea-frontend/src/components/3d/GalleryRoom.tsx, flat-color path
// only — the textured (PBR photo-scan) surface variant is intentionally not
// ported yet (no @react-three/drei's useTexture on native, no
// surfaceTextures.ts/textureUv.ts mirror). Every exhibition (template or
// custom) always has plain wallColor/floorColor/ceilingColor, so this covers
// 100% of backend-driven exhibitions; textured surfaces are a later
// enhancement, not a golden-path gap.
import { useMemo } from 'react';
import * as THREE from 'three';
import { useExhibition } from './ExhibitionContext';

export default function GalleryRoom() {
  const { layout, exhibition } = useExhibition();
  const { theme } = exhibition;
  const { room, walls, wallHeight } = layout;

  const floorMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.floorColor, roughness: theme.floorRoughness, metalness: theme.floorMetalness }),
    [theme.floorColor, theme.floorRoughness, theme.floorMetalness]
  );
  const ceilingMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.ceilingColor, roughness: 1, metalness: 0 }),
    [theme.ceilingColor]
  );
  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.wallColor, roughness: theme.wallRoughness, metalness: 0 }),
    [theme.wallColor, theme.wallRoughness]
  );

  return (
    <group>
      <mesh
        position={[room.center[0], 0, room.center[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={floorMaterial}
      >
        <planeGeometry args={room.size} />
      </mesh>

      <mesh
        position={[room.center[0], wallHeight, room.center[1]]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
        material={ceilingMaterial}
      >
        <planeGeometry args={room.size} />
      </mesh>

      {walls.map((wall) => (
        <mesh key={wall.id} position={wall.position} castShadow receiveShadow material={wallMaterial}>
          <boxGeometry args={wall.size} />
        </mesh>
      ))}
    </group>
  );
}
