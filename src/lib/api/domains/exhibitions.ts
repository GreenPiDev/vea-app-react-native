// Mirrors vea-frontend/src/lib/api/domains/exhibitions.ts. Faz 3 (mobile 3D
// gallery) only needs the read side (usePublicExhibitions/useExhibition) —
// write mutations (create/place-artwork/status) belong to a mobile curator
// panel, which is out of scope until Faz 5 is confirmed needed. Keep the
// ApiSceneConfig/ArtworkPositionData/ApiExhibitionArtwork/ApiExhibition
// shapes byte-for-byte in sync with web and vea-api's DTOs regardless (same
// cross-repo caveat as SOCKET_EVENTS) since backendAdapter.ts depends on them.
import { Paths } from '../paths';
import { useApiGet, useApiGetList } from '../factory';
import type { ApiArtwork } from './artworks';

export interface TemplateSceneConfig {
  kind: 'template';
  templateId: string;
}

export interface CustomSceneConfig {
  kind: 'custom';
  cells: { x: number; z: number }[];
  wallHeight: number;
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  textureIds?: { floor?: string; wall?: string; ceiling?: string };
  spawn: { x: number; z: number; yaw: number };
}

export type ApiSceneConfig = TemplateSceneConfig | CustomSceneConfig;

export interface ArtworkPositionData {
  wallRunId: string;
  /** Curator-set hang-center height override, in meters from the floor. Falls back to placeArtworksAlongWall()'s fixed floor-clearance formula when unset. */
  heightY?: number;
}

export interface ApiExhibitionArtwork {
  id: string;
  exhibitionId: string;
  artworkId: string;
  positionData: ArtworkPositionData | null;
  order: number | null;
  artwork: ApiArtwork;
}

export interface ApiExhibition {
  id: string;
  curatorUserId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'ENDED';
  sceneConfig: ApiSceneConfig | null;
  maxArtworks: number | null;
  createdAt: string;
  /** Only present on GET /exhibitions/:id — list endpoints don't include it. */
  artworkLinks?: ApiExhibitionArtwork[];
}

export function usePublicExhibitions() {
  return useApiGetList<ApiExhibition>(Paths.Exhibitions);
}

export function useExhibition(id: string) {
  return useApiGet<ApiExhibition>(`${Paths.Exhibitions}/${id}`, [Paths.Exhibitions, id], {
    enabled: Boolean(id),
  });
}
