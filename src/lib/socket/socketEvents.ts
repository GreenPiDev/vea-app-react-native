// Mirrors vea-api/src/realtime/socket-events.ts AND vea-frontend/src/lib/
// socket/socketEvents.ts — same names, same values, across all three repos
// now (no shared package). Update by hand whenever the backend's
// SOCKET_EVENTS changes.
export const SOCKET_EVENTS = {
  // Client -> Server
  ExhibitionJoin: 'exhibition:join',
  ExhibitionLeave: 'exhibition:leave',
  // Server -> Client
  ExhibitionVisitorCount: 'exhibition:visitorCount',
  ExhibitionError: 'exhibition:error',
} as const;
