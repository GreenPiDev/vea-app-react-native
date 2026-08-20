// Mirrors vea-frontend/src/components/3d/Gallery.tsx byte-for-byte.
import GalleryRoom from './GalleryRoom';
import GalleryLights from './GalleryLights';
import GalleryArtworks from './GalleryArtworks';
import Baseboards from './Baseboards';

export default function Gallery() {
  return (
    <>
      <GalleryRoom />
      <GalleryLights />
      <Baseboards />
      <GalleryArtworks />
    </>
  );
}
