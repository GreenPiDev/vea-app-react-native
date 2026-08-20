// Native equivalent of @react-three/drei's useTexture (not installed on
// this platform, see CLAUDE.md — no drei dependency here at all).
//
// Real-device finding (2026-08-20): stock `THREE.TextureLoader` does NOT
// work here — it throws `ReferenceError: Property 'document' doesn't exist`
// on Android/Hermes, since its internal ImageLoader creates a DOM <img> via
// `document.createElementNS(...)`, and RN has no `document` at all (expo-gl
// does NOT polyfill it, contrary to what this file originally assumed).
// `expo-three`'s TextureLoader is a drop-in THREE.TextureLoader subclass
// that instead downloads the image via expo-asset and decodes it through
// expo-gl's native texture upload path — no DOM involved.
//
// Unlike drei's useTexture, this is NOT Suspense-based — a bad artwork
// imageUrl (free-text, artist-supplied, never validated for reachability by
// vea-api) fails as an async callback, not a thrown render error, so
// ArtworkErrorBoundary alone can't catch it. Callers check `error` and skip
// rendering that artwork instead.
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { TextureLoader as ExpoTextureLoader } from 'expo-three';

interface RemoteTextureState {
  texture: THREE.Texture | null;
  error: boolean;
}

const loader = new ExpoTextureLoader();

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
