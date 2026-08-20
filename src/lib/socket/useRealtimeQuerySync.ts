import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { connectSocket } from './socketClient';

interface RealtimeInvalidation {
  event: string;
  invalidateKeys: QueryKey[];
}

/**
 * Mirrors vea-frontend/src/lib/socket/useRealtimeQuerySync.ts. Central
 * map: socket event name -> which TanStack Query keys to refetch when it
 * fires. Empty today — see useExhibitionVisitorCount.ts for the one live
 * event vea-api currently emits (no backing REST resource to invalidate).
 */
export const REALTIME_INVALIDATION_MAP: RealtimeInvalidation[] = [];

/** Mount once near the app root once real invalidation entries exist above. */
export function useRealtimeQuerySync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (REALTIME_INVALIDATION_MAP.length === 0) return;

    const socket = connectSocket();
    const registered = REALTIME_INVALIDATION_MAP.map(({ event, invalidateKeys }) => {
      const handler = () => {
        invalidateKeys.forEach((queryKey) => {
          void queryClient.invalidateQueries({ queryKey });
        });
      };
      socket.on(event, handler);
      return { event, handler };
    });

    return () => {
      registered.forEach(({ event, handler }) => socket.off(event, handler));
    };
  }, [queryClient]);
}
