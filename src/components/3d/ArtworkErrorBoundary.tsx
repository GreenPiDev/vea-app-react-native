// Mirrors vea-frontend/src/components/3d/ArtworkErrorBoundary.tsx
// byte-for-byte — pure React class component, no DOM dependency.
import { Component, type ReactNode } from 'react';

interface Props {
  artworkId: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Wraps a single Artwork so a render-time failure only drops that one
 * painting instead of throwing all the way up through react-three-fiber's
 * render tree. Texture *load* failures (bad imageUrl — the realistic risk,
 * same as web) are handled separately by useRemoteTexture.ts's error state,
 * since a failed async load doesn't throw during render for this to catch.
 */
export class ArtworkErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[Artwork ${this.props.artworkId}] failed to render:`, error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
