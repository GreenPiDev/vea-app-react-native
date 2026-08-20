// Mirrors vea-frontend/src/lib/api/paths.ts byte-for-byte — single source
// of truth for backend REST paths on this platform. Never inline a path
// string elsewhere; add it here so a route rename is a one-line change.
export const Paths = {
  AuthRequestCode: '/auth/request-code',
  AuthVerifyCode: '/auth/verify-code',
  AuthMe: '/auth/me',

  ArtistProfiles: '/artist-profiles',
  ArtistProfileMe: '/artist-profiles/me',

  Artworks: '/artworks',
  ArtworksMine: '/artworks/mine',

  Exhibitions: '/exhibitions',
  ExhibitionsMine: '/exhibitions/mine',

  OffersMineBuying: '/offers/mine/buying',
  OffersMineSelling: '/offers/mine/selling',
} as const;
