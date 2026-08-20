// Mirrors vea-frontend/src/components/3d/GalleryLights.tsx byte-for-byte —
// pure R3F JSX intrinsics (ambientLight/hemisphereLight/spotLight/mesh),
// no web-only API involved, copies verbatim.
import { useExhibition } from './ExhibitionContext';

export default function GalleryLights() {
  const { layout, exhibition } = useExhibition();
  const { theme } = exhibition;

  return (
    <>
      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity} />
      <hemisphereLight args={[theme.hemisphereSkyColor, theme.hemisphereGroundColor, 0.4]} />

      {layout.ceilingSpots.map(([x, y, z], i) => (
        <spotLight
          key={i}
          position={[x, y, z]}
          angle={0.58}
          penumbra={0.6}
          intensity={theme.spotIntensity}
          distance={14}
          decay={2}
          color={theme.spotColor}
          castShadow={i < 3}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.001}
        />
      ))}

      {layout.ceilingSpots.map(([x, , z], i) => (
        <mesh key={`fixture-${i}`} position={[x, layout.wallHeight - 0.05, z]}>
          <cylinderGeometry args={[0.18, 0.18, 0.06, 20]} />
          <meshStandardMaterial color="#111111" emissive={theme.spotColor} emissiveIntensity={1.2} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}
