import './global.css';
import './src/lib/i18n';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/lib/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Provider order mirrors vea-frontend/src/main.tsx: QueryClientProvider
// wraps AuthProvider (AuthContext's useCurrentUser needs TanStack Query),
// which wraps everything else. NavigationContainer/SafeAreaProvider are
// RN-only additions — web has no router (see vea-app-react-native/CLAUDE.md
// parity table).
const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
