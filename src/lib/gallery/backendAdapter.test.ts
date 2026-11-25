// Mirrors vea-frontend/src/components/3d/backendAdapter.test.ts (Vitest ->
// Jest globals port, otherwise identical fixtures/assertions).
import { adaptApiExhibition, groupByWallRun, wallRunsForSceneConfig } from './backendAdapter';
import type { ApiExhibition, ApiExhibitionArtwork, CustomSceneConfig } from '../api/domains/exhibitions';
import type { ApiArtwork } from '../api/domains/artworks';

function makeArtwork(overrides: Partial<ApiArtwork> = {}): ApiArtwork {
  return {
    id: 'artwork-1',
    artistProfileId: 'profile-1',
    title: 'Test Painting',
    technique: null,
    yearCreated: 1900,
    heightCm: 180,
    widthCm: 120,
    orientation: 'PORTRAIT',
    story: null,
    conditionStatus: null,
    conditionNotes: null,
    note: null,
    category: 'PAINTING',
    priceAmount: 100000,
    currency: 'TRY',
    imageUrl: 'https://example.com/painting.jpg',
    model3dUrl: null,
    status: 'IN_EXHIBITION',
    createdAt: '2026-01-01T00:00:00.000Z',
    artistProfile: { displayName: 'Test Artist' },
    ...overrides,
  };
}

function makeLink(overrides: Partial<ApiExhibitionArtwork> = {}): ApiExhibitionArtwork {
  return {
    id: 'link-1',
    exhibitionId: 'exhibition-1',
    artworkId: 'artwork-1',
    positionData: { wallRunId: 'north' },
    order: 0,
    artwork: makeArtwork(),
    ...overrides,
  };
}

function makeExhibition(overrides: Partial<ApiExhibition> = {}): ApiExhibition {
  return {
    id: 'exhibition-1',
    curatorUserId: 'user-1',
    title: 'Test Exhibition',
    description: 'A description',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-02-01T00:00:00.000Z',
    status: 'ACTIVE',
    sceneConfig: null,
    maxArtworks: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    artworkLinks: [],
    ...overrides,
  };
}

/** A drawn 6 × 4 m room, 6 m high — the only kind of room mobile renders (template rooms aren't ported yet). */
const ROOM: CustomSceneConfig = {
  kind: 'custom',
  cells: Array.from({ length: 6 * 4 }, (_, i) => ({ x: i % 6, z: Math.floor(i / 6) })),
  wallHeight: 6,
  wallColor: '#efe4cf',
  floorColor: '#8a6a45',
  ceilingColor: '#f7f0e0',
  spawn: { x: 2, z: 2, yaw: 0 },
};
/** The room's longest wall run — every placement test hangs on it. */
const WALL = [...wallRunsForSceneConfig(ROOM)!].sort((a, b) => b.end - b.start - (a.end - a.start))[0].id;

describe('adaptApiExhibition', () => {
  it('returns null when sceneConfig is missing', () => {
    expect(adaptApiExhibition(makeExhibition({ sceneConfig: null }))).toBeNull();
  });

  it('returns null for a template sceneConfig (backend ExhibitionTemplates are not ported to mobile yet)', () => {
    const result = adaptApiExhibition(
      makeExhibition({ sceneConfig: { kind: 'template', templateId: 'renaissance' } })
    );
    expect(result).toBeNull();
  });

  it('places artworks on the wall run their positionData names', () => {
    const result = adaptApiExhibition(
      makeExhibition({
        title: 'My Room',
        sceneConfig: ROOM,
        artworkLinks: [makeLink({ positionData: { wallRunId: WALL } })],
      })
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe('exhibition-1');
    expect(result!.name).toBe('My Room');
    expect(result!.wallHeight).toBe(6);
    expect(result!.artworks).toHaveLength(1);
    expect(result!.artworks![0].frame).toBeNull();
    expect(result!.artworks![0].artist).toBe('Test Artist');
  });

  it('uses positionData.heightY as a curator hang-height override when set', () => {
    const result = adaptApiExhibition(
      makeExhibition({
        sceneConfig: ROOM,
        artworkLinks: [makeLink({ positionData: { wallRunId: WALL, heightY: 2.2 } })],
      })
    );

    expect(result!.artworks![0].position[1]).toBeCloseTo(2.2);
  });

  it("falls back to a Turkish placeholder artist name when artistProfile isn't embedded", () => {
    const result = adaptApiExhibition(
      makeExhibition({
        sceneConfig: ROOM,
        artworkLinks: [makeLink({ positionData: { wallRunId: WALL }, artwork: makeArtwork({ artistProfile: undefined }) })],
      })
    );

    expect(result!.artworks![0].artist).toBe('Bilinmeyen Sanatçı');
  });

  it('builds a custom exhibition from cells/spawn and derives a full theme from the 3 picked colors', () => {
    const result = adaptApiExhibition(
      makeExhibition({
        sceneConfig: {
          kind: 'custom',
          cells: [
            { x: 0, z: 0 },
            { x: 1, z: 0 },
          ],
          wallHeight: 4,
          wallColor: '#112233',
          floorColor: '#445566',
          ceilingColor: '#778899',
          spawn: { x: 0, z: 0, yaw: 0 },
        },
        artworkLinks: [],
      })
    );

    expect(result).not.toBeNull();
    expect(result!.custom).toBe(true);
    expect(result!.customLayout).toBeDefined();
    expect(result!.theme.wallColor).toBe('#112233');
    expect(result!.theme.backgroundColor).toBe('#112233');
    expect(result!.theme.fogColor).toBe('#445566');
    expect(result!.artworks).toEqual([]);
  });

  it('places multiple artworks sharing the same wall run, ordered by the `order` column', () => {
    const result = adaptApiExhibition(
      makeExhibition({
        sceneConfig: ROOM,
        artworkLinks: [
          makeLink({ id: 'link-b', order: 1, positionData: { wallRunId: WALL }, artwork: makeArtwork({ id: 'b', title: 'Second' }) }),
          makeLink({ id: 'link-a', order: 0, positionData: { wallRunId: WALL }, artwork: makeArtwork({ id: 'a', title: 'First' }) }),
        ],
      })
    );

    expect(result!.artworks).toHaveLength(2);
    expect(result!.artworks!.map((a) => a.title)).toEqual(['First', 'Second']);
    expect(result!.artworks![0].position[0]).not.toBeCloseTo(result!.artworks![1].position[0]);
  });

  it('ignores links with no positionData (not hung on a wall yet)', () => {
    const result = adaptApiExhibition(
      makeExhibition({
        sceneConfig: ROOM,
        artworkLinks: [makeLink({ positionData: null })],
      })
    );

    expect(result!.artworks).toEqual([]);
  });

  it('treats a missing artworkLinks (e.g. from a list endpoint) as an empty room', () => {
    const result = adaptApiExhibition(
      makeExhibition({
        sceneConfig: ROOM,
        artworkLinks: undefined,
      })
    );

    expect(result!.artworks).toEqual([]);
  });
});

describe('wallRunsForSceneConfig', () => {
  it('returns null for a missing sceneConfig', () => {
    expect(wallRunsForSceneConfig(null)).toBeNull();
  });

  it('returns null for a template sceneConfig (not ported to mobile yet)', () => {
    expect(wallRunsForSceneConfig({ kind: 'template', templateId: 'renaissance' })).toBeNull();
  });

  it('returns one run per boundary edge for a custom sceneConfig', () => {
    const runs = wallRunsForSceneConfig({
      kind: 'custom',
      cells: [{ x: 0, z: 0 }],
      wallHeight: 4,
      wallColor: '#112233',
      floorColor: '#445566',
      ceilingColor: '#778899',
      spawn: { x: 0, z: 0, yaw: 0 },
    });

    expect(runs).toHaveLength(4);
  });
});

describe('groupByWallRun', () => {
  it('groups links by wallRunId and sorts by the order column', () => {
    const links = [
      makeLink({ id: 'b', order: 1, positionData: { wallRunId: 'north' } }),
      makeLink({ id: 'a', order: 0, positionData: { wallRunId: 'north' } }),
      makeLink({ id: 'c', order: 0, positionData: { wallRunId: 'south' } }),
    ];

    const byWall = groupByWallRun(links);

    expect(byWall.get('north')?.map((l) => l.id)).toEqual(['a', 'b']);
    expect(byWall.get('south')?.map((l) => l.id)).toEqual(['c']);
  });

  it('ignores links with no positionData', () => {
    const links = [makeLink({ id: 'a', positionData: null })];

    expect(groupByWallRun(links).size).toBe(0);
  });
});
