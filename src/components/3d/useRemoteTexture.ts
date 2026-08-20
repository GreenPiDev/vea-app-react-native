// Native equivalent of @react-three/drei's useTexture (not installed on
// this platform, see CLAUDE.md — no drei dependency here at all). expo-gl's
// GLView + @react-three/fiber's native renderer polyfill enough of the
// browser Image/Canvas surface for three.js's stock TextureLoader to work
// directly against a remote https URL, same loading chain proven by the
// Faz 2 spike (expo-gl + three render chain, verified at 120fps on device).
//
// Unlike drei's useTexture, this is NOT Suspense-based — a bad artwork
// imageUrl (free-text, artist-supplied, never validated for reachability by
// vea-api) fails as an async callback, not a thrown render error, so
// ArtworkErrorBoundary alone can't catch it. Callers check `error` and skip
// rendering that artwork instead.
import { useEffect, useState } from 'react';
import * as THREE from 'three';

interface RemoteTextureState {
  texture: THREE.Texture | null;
  error: boolean;
}

const loader = new THREE.TextureLoader();

export function useRemoteTexture(url: string): RemoteTextureState {
  const [state, setState] = useState<RemoteTextureState>({ texture: null, error: false });

  useEffect(() => {
    let cancelled = false;
    setState({ texture: null, error: false });

    loader.load(
      url,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        setState({ texture, error: false });
      },
      undefined,
      (err) => {
        if (cancelled) return;
        console.error(`[useRemoteTexture] failed to load ${url}:`, err);
        setState({ texture: null, error: true });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const texture = state.texture;
    return () => {
      texture?.dispose();
    };
  }, [state.texture]);

  return state;
}
