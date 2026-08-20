// Mirrors vea-frontend/src/components/3d/ExhibitionContext.tsx — pure React
// context, no DOM dependency, copies verbatim.
import { createContext, useContext, type ReactNode } from 'react';
import type { Exhibition } from '../../lib/gallery/exhibitions';
import type { RoomLayout } from '../../lib/gallery/galleryLayout';

interface ExhibitionContextValue {
  exhibition: Exhibition;
  layout: RoomLayout;
}

const ExhibitionContext = createContext<ExhibitionContextValue | null>(null);

export function ExhibitionProvider({
  exhibition,
  layout,
  children,
}: ExhibitionContextValue & { children: ReactNode }) {
  return <ExhibitionContext.Provider value={{ exhibition, layout }}>{children}</ExhibitionContext.Provider>;
}

export function useExhibition(): ExhibitionContextValue {
  const ctx = useContext(ExhibitionContext);
  if (!ctx) throw new Error('useExhibition must be used within an ExhibitionProvider');
  return ctx;
}
