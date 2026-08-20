// Mirrors the renderable-artwork shape from
// vea-frontend/src/components/3d/artworks.ts. Only the `Artwork` type is
// mirrored here, not the static ARTWORKS demo collection (the curated
// Wikimedia paintings for the 4 preset template rooms) — mobile Faz 3's
// golden path targets backend-driven exhibitions only; whether the 4 static
// demo galleries also need mobile parity is an open product question (see
// project_mobile_app_roadmap memory), not blocking here since
// backendAdapter.ts never needs ARTWORKS to render a backend exhibition.
export type FrameStyle = "gold" | "walnut";

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  /** Which exhibition this painting is hung in. */
  exhibitionId: string;
  /** Image URL (backend-sourced) or local demo asset path. */
  image: string;
  /** Real image aspect ratio (width / height), used to size the canvas. */
  aspect: number;
  /** Physical height of the canvas on the wall, in meters. */
  height: number;
  /** Undefined/null for backend-sourced artworks — the artist's uploaded image already includes its own frame, so no extra 3D frame mesh is rendered. */
  frame?: FrameStyle | null;
  /** Center position of the canvas face, flush against the wall surface. */
  position: [number, number, number];
  /** Yaw so the painting's front faces into the room. */
  rotationY: number;
}
