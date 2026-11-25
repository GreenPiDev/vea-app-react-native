// Mirrors vea-frontend/src/components/3d/backendAdapter.ts. Converts a
// backend ApiExhibition (vea-api's GET /exhibitions/:id shape, see
// lib/api/domains/exhibitions.ts) into the renderable Exhibition/Artwork
// shapes this platform's (future) 3D scene will consume — same role as on
// web, kept in sync by hand.
import type {
  ApiExhibition,
  ApiExhibitionArtwork,
  ApiSceneConfig,
  CustomSceneConfig,
} from "../api/domains/exhibitions";
import type { Artwork } from "./artworks";
import type { Exhibition, ExhibitionTheme } from "./exhibitions";
import {
  buildCustomRoomLayout,
  placeArtworksAlongWall,
  type WallRunGeometry,
} from "./galleryLayout";

/** The 4 fixed walls of a rectangular template room, in the same {start,end,orientation,fixed,outward} shape buildCustomRoomLayout's CustomWallRun uses — lets template and custom rooms share one placement function. Geometry/ids match buildRoomLayout exactly (see galleryLayout.ts). */
export function templateWallRuns(roomSize: [number, number]): (WallRunGeometry & { id: string })[] {
  const [W, D] = roomSize;
  return [
    { id: "north", orientation: "horizontal", start: -W / 2, end: W / 2, fixed: -D / 2, outward: -1 },
    { id: "south", orientation: "horizontal", start: -W / 2, end: W / 2, fixed: D / 2, outward: 1 },
    { id: "east", orientation: "vertical", start: -D / 2, end: D / 2, fixed: W / 2, outward: 1 },
    { id: "west", orientation: "vertical", start: -D / 2, end: D / 2, fixed: -W / 2, outward: -1 },
  ];
}

/** Groups artworkLinks by their positionData.wallRunId, sorted by the sibling `order` column (nulls last, then by id for a stable tie-break). Links with no positionData/wallRunId aren't placed (not hung yet). */
export function groupByWallRun(links: ApiExhibitionArtwork[]): Map<string, ApiExhibitionArtwork[]> {
  const byWall = new Map<string, ApiExhibitionArtwork[]>();
  for (const link of links) {
    const wallRunId = link.positionData?.wallRunId;
    if (!wallRunId) continue;
    const list = byWall.get(wallRunId);
    if (list) list.push(link);
    else byWall.set(wallRunId, [link]);
  }
  for (const list of byWall.values()) {
    list.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
  }
  return byWall;
}

function toRenderableArtwork(link: ApiExhibitionArtwork, exhibitionId: string, placement: ReturnType<typeof placeArtworksAlongWall>[number]): Artwork {
  const { artwork } = link;
  return {
    id: link.id,
    title: artwork.title,
    artist: artwork.artistProfile?.displayName ?? "Bilinmeyen Sanatçı",
    year: artwork.yearCreated ? String(artwork.yearCreated) : "",
    exhibitionId,
    image: artwork.imageUrl,
    aspect: artwork.widthCm / artwork.heightCm,
    height: placement.height,
    frame: null,
    position: placement.position,
    rotationY: placement.rotationY,
  };
}

function placeAll(
  runs: (WallRunGeometry & { id: string })[],
  wallHeight: number,
  byWall: Map<string, ApiExhibitionArtwork[]>,
  exhibitionId: string
): Artwork[] {
  const artworks: Artwork[] = [];
  for (const run of runs) {
    const links = byWall.get(run.id);
    if (!links || links.length === 0) continue;
    const placements = placeArtworksAlongWall(
      run,
      wallHeight,
      links.map((link) => ({
        aspect: link.artwork.widthCm / link.artwork.heightCm,
        height: link.artwork.heightCm / 100,
        heightYOverride: link.positionData?.heightY,
        alongFraction: link.positionData?.alongFraction,
      }))
    );
    links.forEach((link, i) => artworks.push(toRenderableArtwork(link, exhibitionId, placements[i])));
  }
  return artworks;
}

/** The user only picks 3 flat colors + optional textures (web panel/ExhibitionForm.tsx); everything else is a fixed/derived value tuned for a neutral, gallery-appropriate look — same formula web's adapter uses. Keep this in sync with the web version. */
function buildCustomTheme(config: CustomSceneConfig): ExhibitionTheme {
  return {
    wallColor: config.wallColor,
    wallRoughness: 0.85,
    floorColor: config.floorColor,
    floorRoughness: 0.35,
    floorMetalness: 0.05,
    ceilingColor: config.ceilingColor,
    fogColor: config.floorColor,
    backgroundColor: config.wallColor,
    ambientColor: "#fff4e0",
    ambientIntensity: 0.42,
    hemisphereSkyColor: "#ffffff",
    hemisphereGroundColor: config.floorColor,
    spotColor: "#fff4e0",
    spotIntensity: 22,
    floorTextureId: config.textureIds?.floor,
    wallTextureId: config.textureIds?.wall,
    ceilingTextureId: config.textureIds?.ceiling,
  };
}

/**
 * A cheap accent color for an exhibition-select card, computed straight from
 * sceneConfig alone (no artworkLinks needed).
 */
export function previewAccentColor(config: ApiSceneConfig | null): string {
  if (!config || config.kind === "template") return "#b9924a";
  return config.wallColor;
}

/**
 * The wall runs a given sceneConfig produces, regardless of kind. Returns
 * null under the same "can't resolve" conditions as adaptApiExhibition
 * (missing sceneConfig, or a "template" — see there).
 */
export function wallRunsForSceneConfig(config: ApiSceneConfig | null): (WallRunGeometry & { id: string })[] | null {
  if (!config) return null;
  if (config.kind === "template") return null;
  return buildCustomRoomLayout(config.cells, config.wallHeight, config.spawn).wallRuns;
}

/**
 * Converts a backend ApiExhibition (must include artworkLinks — i.e. come
 * from useExhibition(id)) into a renderable Exhibition, or null if it can't
 * be rendered yet: no sceneConfig, or a "template". Web resolves a template
 * against the org's backend ExhibitionTemplate (exhibition.exhibitionTemplate);
 * mobile doesn't mirror that yet — and the static presets it used to resolve
 * instead were removed before launch (2026-11-25) — so template-based
 * exhibitions don't open on mobile until that port is done.
 */
export function adaptApiExhibition(exhibition: ApiExhibition): Exhibition | null {
  const config = exhibition.sceneConfig;
  if (!config) return null;

  const byWall = groupByWallRun(exhibition.artworkLinks ?? []);

  if (config.kind === "template") return null;

  const { layout, wallRuns } = buildCustomRoomLayout(config.cells, config.wallHeight, config.spawn);
  return {
    id: exhibition.id,
    name: exhibition.title,
    subtitle: exhibition.description ?? "",
    wallHeight: config.wallHeight,
    custom: true,
    customLayout: layout,
    artworks: placeAll(wallRuns, config.wallHeight, byWall, exhibition.id),
    theme: buildCustomTheme(config),
  };
}
