import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ThreeDSpikeScreen } from '../screens/ThreeDSpikeScreen';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  ThreeDSpike: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Faz 1: Home stays public (gallery browsing has no auth guard on the
// backend, same as web's AuthBar not gating the app) + a Login screen
// presented as a native modal — the RN-idiomatic equivalent of web's
// AuthBar-triggered inline modal overlay.
//
// Faz 2: ThreeDSpike is a dev-only entry point (reachable from a button
// on Home, see HomeScreen.tsx) to prove the native expo-gl/R3F render
// chain works — not part of the real navigation flow, will be removed
// once Faz 3 replaces it with the actual gallery screen.
export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'vea' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="ThreeDSpike" component={ThreeDSpikeScreen} options={{ title: '3D Spike (Faz 2)' }} />
    </Stack.Navigator>
  );
}
