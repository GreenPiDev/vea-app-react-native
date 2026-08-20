import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import App from './App';

jest.mock('expo-secure-store', () => {
  let token: string | null = null;
  return {
    getItemAsync: jest.fn(() => Promise.resolve(token)),
    setItemAsync: jest.fn((_key: string, value: string) => {
      token = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn(() => {
      token = null;
      return Promise.resolve();
    }),
  };
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// Pressable's disabled-responder needs a microtask tick to settle after a
// sibling TextInput's state update before RNTL's fireEvent.press will
// register — a test-renderer timing quirk (not a real-device issue, real
// touch events always dispatch after JS has settled). Flush (inside
// act, via waitFor) between changeText and a press that depends on the
// just-changed value.
function flush() {
  return waitFor(() => {});
}

/**
 * Faz 1 golden-path + edge-case coverage for the Home -> Login -> Home
 * flow, exercising the real navigation/AuthContext/TanStack Query wiring
 * together (auth.test.tsx already covers the hooks in isolation — this
 * proves the screens are actually wired to them correctly). See
 * feedback_write_tests memory: don't call a phase done without this.
 */
describe('Auth flow (mobile, Faz 1)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    // The mocked expo-secure-store keeps its "stored token" in module
    // scope so setItemAsync (called by AuthContext.login) is observable —
    // reset it between tests so login state doesn't leak across specs.
    await SecureStore.deleteItemAsync('vea_access_token');
  });

  it('golden path: request code, verify code, becomes authenticated', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url.includes('/auth/request-code')) return Promise.resolve(jsonResponse({ status: 'sent' }));
      if (url.includes('/auth/verify-code')) return Promise.resolve(jsonResponse({ accessToken: 'jwt-abc' }));
      if (url.includes('/auth/me')) {
        return Promise.resolve(
          jsonResponse({ id: '1', email: 'a@b.com', phone: null, role: 'VISITOR', createdAt: '2026-01-01' }),
        );
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await render(<App />);

    fireEvent.press(await screen.findByTestId('home-login'));
    fireEvent.changeText(await screen.findByPlaceholderText('you@example.com'), 'a@b.com');
    await flush();
    fireEvent.press(screen.getByTestId('login-send-code'));

    fireEvent.changeText(await screen.findByPlaceholderText('6-digit code'), '123456');
    await flush();
    fireEvent.press(screen.getByTestId('login-verify-code'));

    expect(await screen.findByText('a@b.com')).toBeTruthy();
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('edge case: wrong code shows an error and stays on the code step', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url.includes('/auth/request-code')) return Promise.resolve(jsonResponse({ status: 'sent' }));
      if (url.includes('/auth/verify-code')) {
        return Promise.resolve(jsonResponse({ message: 'Invalid code' }, false, 400));
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await render(<App />);

    fireEvent.press(await screen.findByTestId('home-login'));
    fireEvent.changeText(await screen.findByPlaceholderText('you@example.com'), 'a@b.com');
    await flush();
    fireEvent.press(screen.getByTestId('login-send-code'));

    fireEvent.changeText(await screen.findByPlaceholderText('6-digit code'), '000000');
    await flush();
    fireEvent.press(screen.getByTestId('login-verify-code'));

    expect(await screen.findByText('Invalid code')).toBeTruthy();
    expect(screen.getByPlaceholderText('6-digit code')).toBeTruthy();
  });

  it('does not fetch /auth/me when there is no stored token', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await render(<App />);
    expect(await screen.findByTestId('home-login')).toBeTruthy();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
