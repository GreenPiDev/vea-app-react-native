import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ThreeDSpikeScreen } from '../screens/ThreeDSpikeScreen';
import { ExhibitionListScreen } from '../screens/ExhibitionListScreen';
import { GalleryScreen } from '../screens/GalleryScreen';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  ThreeDSpike: undefined;
  ExhibitionList: undefined;
  Gallery: { exhibitionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Faz 1: Home stays public (gallery browsing has no auth guard on the
// backend, same as web's AuthBar not gating the app) + a Login screen
// presented as a native modal — the RN-idiomatic equivalent of web's
// AuthBar-triggered inline modal overlay.
//
// Faz 2: ThreeDSpike is a dev-only entry point (reachable from a button
// on Home, see HomeScreen.tsx) to prove the native expo-gl/R3F render
// chain works — kept around post-Faz-3 as a minimal render-chain smoke
// test, not part of the real navigation flow.
//
// Faz 3b: ExhibitionList -> Gallery is the real navigation flow — pick a
// backend exhibition, walk its actual 3D room. Gallery hides its header
// (GalleryScreen draws its own small floating back button instead, plus
// hides the OS status bar and Android nav bar — the walkable room should
// read as full-screen, not share the frame with any chrome).
export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'vea' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="ThreeDSpike" component={ThreeDSpikeScreen} options={{ title: '3D Spike (Faz 2)' }} />
      {/* No static `title` here — ExhibitionListScreen sets it itself via navigation.setOptions() so it can go through i18next (see feedback_no_static_ui_text: no hardcoded UI strings, and Stack.Screen's `options` object is evaluated outside any component that could call useTranslation()). */}
      <Stack.Screen name="ExhibitionList" component={ExhibitionListScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
