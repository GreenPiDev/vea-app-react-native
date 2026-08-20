// Mirrors vea-frontend/src/components/3d/GalleryArtworks.tsx, minus the
// static ARTWORKS-by-id fallback (mobile Faz 3 only renders backend-driven
// exhibitions, which always set exhibition.artworks via backendAdapter.ts —
// see lib/gallery/artworks.ts's note on why the static demo collection
// wasn't mirrored).
import Artwork, { ArtworkLight } from './Artwork';
import { useExhibition } from './ExhibitionContext';
import { ArtworkErrorBoundary } from './ArtworkErrorBoundary';

export default function GalleryArtworks() {
  const { exhibition } = useExhibition();
  const artworks = exhibition.artworks ?? [];

  return (
    <>
      {artworks.map((data) => (
        <ArtworkErrorBoundary key={data.id} artworkId={data.id}>
          <group>
            <Artwork data={data} />
            <ArtworkLight data={data} />
          </group>
        </ArtworkErrorBoundary>
      ))}
    </>
  );
}
