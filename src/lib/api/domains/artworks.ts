// Mirrors vea-frontend/src/lib/api/domains/artworks.ts. Faz 3 only needs the
// ApiArtwork shape (consumed by exhibitions.ts's ApiExhibitionArtwork) plus
// the public list — full artist-panel CRUD (useMyArtworks, mutations,
// status) is deferred to Faz 5 (mobile artist panel, not yet confirmed
// needed — see project_mobile_app_roadmap memory).
import { Paths } from '../paths';
import { useApiGetList } from '../factory';

export type ArtworkCategory = 'PAINTING' | 'SCULPTURE' | 'PHOTOGRAPHY' | 'OTHER';
export type ArtworkOrientation = 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE';
export type ArtworkConditionStatus = 'ORIGINAL' | 'RESTORED' | 'DAMAGED' | 'OTHER';
export type ArtworkStatus = 'DRAFT' | 'LISTED' | 'IN_EXHIBITION' | 'SOLD' | 'ARCHIVED';

export interface ApiArtwork {
  id: string;
  artistProfileId: string;
  title: string;
  technique: string | null;
  yearCreated: number | null;
  heightCm: number;
  widthCm: number;
  orientation: ArtworkOrientation;
  story: string | null;
  conditionStatus: ArtworkConditionStatus | null;
  conditionNotes: string | null;
  note: string | null;
  category: ArtworkCategory;
  priceAmount: number;
  currency: string;
  imageUrl: string;
  model3dUrl: string | null;
  status: ArtworkStatus;
  createdAt: string;
  /** Only present when the backend embeds it (e.g. GET /exhibitions/:id's artworkLinks[].artwork). */
  artistProfile?: { displayName: string };
  exhibitionLinks?: { exhibition: { id: string; title: string; status: 'DRAFT' | 'ACTIVE' | 'ENDED' } }[];
}

export function usePublicArtworks() {
  return useApiGetList<ApiArtwork>(Paths.Artworks);
}
