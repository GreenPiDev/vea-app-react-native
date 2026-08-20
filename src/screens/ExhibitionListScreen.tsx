import { useLayoutEffect } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePublicExhibitions } from '../lib/api/domains/exhibitions';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ExhibitionList'>;

/** Faz 3b: minimal public-exhibitions list, the mobile entry point into GalleryScreen — mirrors web's ExhibitionSelect card-grid role, without the visual polish (accent colors, static template cards) yet; those stay a follow-up, not the golden path this phase targets (backend-driven exhibitions rendering correctly in 3D). */
export function ExhibitionListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('exhibitionListTitle') });
  }, [navigation, t]);

  const { data: exhibitions, isLoading } = usePublicExhibitions();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-50">
        <ActivityIndicator />
      </View>
    );
  }

  if (!exhibitions || exhibitions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-50 p-4">
        <Text className="text-brand-600">{t('exhibitionListEmpty')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-50">
      <FlatList
        data={exhibitions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('Gallery', { exhibitionId: item.id })}
            className="rounded-md bg-white px-4 py-3 shadow-sm"
          >
            <Text className="text-base font-medium text-brand-900">{item.title}</Text>
            {item.description ? <Text className="mt-1 text-sm text-brand-600">{item.description}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}
