// Mirrors vea-frontend/src/components/3d/Artwork.tsx's canvas + spotlight,
// scoped down for this platform: no FrameMesh (backend-sourced artworks
// always have `frame: null` per backendAdapter.ts, on web and here alike,
// so this isn't actually a feature gap) and no in-3D wall-label Text mesh
// (@react-three/drei's Text/troika-three-text isn't available on native —
// see CLAUDE.md). The title/artist/year label web renders on the wall is
// shown here instead as a proximity-triggered RN overlay card, see
// screens/GalleryScreen.tsx's InfoCard — arguably a better touch-UX pattern
// than squinting at 3D wall text on a phone anyway.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Artwork as ArtworkData } from '../../lib/gallery/artworks';
import { useExhibition } from './ExhibitionContext';
import { useRemoteTexture } from './useRemoteTexture';

export default function Artwork({ data, onError }: { data: ArtworkData; onError?: () => void }) {
  const { texture, error } = useRemoteTexture(data.image);

  useEffect(() => {
    if (error) onError?.();
  }, [error, onError]);

  if (error || !texture) return null;

  const width = data.height * data.aspect;

  return (
    <group position={data.position} rotation={[0, data.rotationY, 0]}>
      <mesh>
        <planeGeometry args={[width, data.height]} />
        <meshStandardMaterial map={texture} roughness={0.65} metalness={0} />
      </mesh>
    </group>
  );
}

export function ArtworkLight({ data }: { data: ArtworkData }) {
  const { exhibition, layout } = useExhibition();
  const lightY = Math.min(layout.wallHeight - 0.4, data.position[1] + 3.5);
  const normal = useMemo(
    () => new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), data.rotationY),
    [data.rotationY]
  );
  const target = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(...data.position);
    return obj;
  }, [data.position]);

  return (
    <>
      <primitive object={target} />
      <spotLight
        position={[data.position[0] + normal.x * 1.9, lightY, data.position[2] + normal.z * 1.9]}
        target={target}
        angle={0.32}
        penumbra={0.45}
        intensity={exhibition.theme.spotIntensity}
        distance={7}
        decay={2}
        color={exhibition.theme.spotColor}
      />
    </>
  );
}
