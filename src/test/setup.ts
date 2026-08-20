// react-native-safe-area-context has no native module in the Jest
// environment, so SafeAreaProvider never receives onInsetsChange and
// renders nothing — the library ships this mock (fixed test insets) for
// exactly that reason. See vea-app-react-native/CLAUDE.md test-stack row.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
