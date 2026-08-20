import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../lib/auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Faz 1: gallery placeholder (real 3D content starts Faz 2/3) + an auth
 * control adapted from vea-frontend's AuthBar.tsx. Same "don't gate the
 * app" principle — this screen renders regardless of auth state, login is
 * opt-in.
 */
export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-brand-50 p-4">
      <Text className="text-2xl font-semibold text-brand-900">{t('authTitle')}</Text>
      <Text className="mt-2 text-brand-600">vea-app-react-native — Faz 2</Text>

      <Pressable testID="home-exhibitions" onPress={() => navigation.navigate('ExhibitionList')} className="mt-4 rounded-md bg-brand-700 px-3 py-1.5">
        <Text className="text-sm font-medium text-white">{t('homeBrowseExhibitions')}</Text>
      </Pressable>

      {/* Dev-only entry to the Faz 2 native R3F spike — a minimal render-chain smoke test, kept around after Faz 3's real gallery screen shipped */}
      <Pressable testID="home-3d-spike" onPress={() => navigation.navigate('ThreeDSpike')} className="mt-2 rounded-md bg-brand-200 px-3 py-1.5">
        <Text className="text-sm font-medium text-brand-900">{t('homeThreeDSpikeDev')}</Text>
      </Pressable>

      <View className="absolute right-4 top-4">
        {isAuthenticated ? (
          <View className="flex-row items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 shadow-sm">
            <Text className="text-sm text-brand-800">{isLoading ? '…' : user?.email}</Text>
            <Pressable onPress={logout}>
              <Text className="text-sm text-brand-600 underline">{t('authLogout')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="home-login"
            onPress={() => navigation.navigate('Login')}
            className="rounded-md bg-white/90 px-3 py-1.5 shadow-sm"
          >
            <Text className="text-sm font-medium text-brand-800">{t('authLogin')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
