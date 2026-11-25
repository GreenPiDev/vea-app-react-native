// Mirrors vea-frontend/src/components/3d/exhibitions.ts's Exhibition/
// ExhibitionTheme types. The 4 static preset rooms that used to live here were
// removed before launch (2026-11-25), together with web's demo rooms.
import type { Artwork } from "./artworks";
import type { RoomLayout } from "./galleryLayout";

export interface ExhibitionTheme {
  wallColor: string;
  wallRoughness: number;
  floorColor: string;
  floorRoughness: number;
  floorMetalness: number;
  ceilingColor: string;
  fogColor: string;
  backgroundColor: string;
  ambientColor: string;
  ambientIntensity: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  spotColor: string;
  spotIntensity: number;
  /** Optional real-photo PBR texture id — overrides the flat color when set. */
  floorTextureId?: string;
  wallTextureId?: string;
  ceilingTextureId?: string;
}

export interface Exhibition {
  id: string;
  name: string;
  subtitle: string;
  /** [width (x), depth (z)] of the standalone room — unused when customLayout is set. */
  roomSize?: [number, number];
  wallHeight: number;
  theme: ExhibitionTheme;
  /** True for a user-drawn exhibition (custom room, not a preset template). */
  custom?: boolean;
  /** Precomputed layout for a user-drawn (non-rectangular) room; overrides roomSize. */
  customLayout?: RoomLayout;
  /** Explicit hung collection; overrides any by-id lookup. */
  artworks?: Artwork[];
}
