import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Mirrors vea-frontend/src/lib/api/authToken.ts's role (single place to
// read/write the JWT), but the storage primitive differs on purpose:
// expo-secure-store persists in the native keychain/keystore instead of
// plaintext localStorage/AsyncStorage, and its API is async — every call
// site (client.ts, AuthContext.tsx) awaits these instead of reading
// synchronously like the web version does.
//
// expo-secure-store has no web implementation (native keychain/keystore is
// not a web concept — its web build is a literal no-op module), so `npm
// run web` — a debug convenience, not a shipped target, see
// vea-app-react-native/CLAUDE.md — falls back to localStorage there only.
// iOS/Android always use the real SecureStore.
const STORAGE_KEY = 'vea_access_token';

export function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem(STORAGE_KEY));
  return SecureStore.getItemAsync(STORAGE_KEY);
}

export function setAccessToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  }
  return token ? SecureStore.setItemAsync(STORAGE_KEY, token) : SecureStore.deleteItemAsync(STORAGE_KEY);
}
