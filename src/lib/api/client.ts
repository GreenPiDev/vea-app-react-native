import { getAccessToken } from './authToken';

// Mirrors vea-frontend/src/lib/api/client.ts. Expo's public env var
// convention is EXPO_PUBLIC_* (inlined at build time, same "not secret,
// ends up in the bundle regardless" reasoning as web's VITE_API_URL) — see
// .env. Real-device testing needs the dev machine's LAN IP here, not
// localhost (localhost on-device resolves to the device itself); iOS
// simulator/Android emulator have their own quirks, see README once written.
const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === 'object' && body && 'message' in body ? String(body.message) : 'API request failed');
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  path: string;
  payload?: unknown;
}

async function request<T>(method: string, { path, payload }: RequestOptions): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export const get = <T>(opts: RequestOptions) => request<T>('GET', opts);
export const post = <T>(opts: RequestOptions) => request<T>('POST', opts);
export const patch = <T>(opts: RequestOptions) => request<T>('PATCH', opts);
export const remove = <T>(opts: RequestOptions) => request<T>('DELETE', opts);
