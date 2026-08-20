import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRequestCode, useVerifyCode } from '../lib/api/domains/auth';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api/client';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Step = 'email' | 'code';
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Adapted from vea-frontend/src/components/auth/Login.tsx — same two-step
 * (email -> code) flow and the same mutation/error wiring. Presentation
 * differs: web opens this in an inline modal overlay from AuthBar; here
 * it's a pushed screen (registered with presentation: 'modal' in
 * RootNavigator) since React Navigation is the RN-native equivalent of
 * that pattern (see vea-app-react-native/CLAUDE.md parity table).
 */
export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestCode = useRequestCode();
  const verifyCode = useVerifyCode();
  const { login } = useAuth();

  function handleRequestCode() {
    setError(null);
    requestCode.mutate(email, {
      onSuccess: () => setStep('code'),
      onError: (err) => setError(err instanceof ApiError ? err.message : t('authErrorSendFailed')),
    });
  }

  function handleVerifyCode() {
    setError(null);
    verifyCode.mutate(
      { email, code },
      {
        onSuccess: async ({ accessToken }) => {
          await login(accessToken);
          navigation.goBack();
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : t('authErrorVerifyFailed')),
      },
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-brand-50 p-6">
      <View className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
        <Text className="mb-1 text-xl font-semibold text-brand-900">{t('authTitle')}</Text>
        <Text className="mb-6 text-sm text-brand-600">
          {step === 'email' ? t('authSubtitleEmail') : t('authSubtitleCode', { email })}
        </Text>

        {step === 'email' ? (
          <View className="gap-3">
            <TextInput
              autoFocus
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t('authEmailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              className="rounded-md border border-brand-300 bg-white px-3 py-2 text-sm text-brand-900"
            />
            <Pressable
              testID="login-send-code"
              onPress={handleRequestCode}
              disabled={requestCode.isPending || email.length === 0}
              className="items-center rounded-md bg-brand-700 px-3 py-2 disabled:opacity-50"
            >
              {requestCode.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-sm font-medium text-white">{t('authSendCode')}</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            <TextInput
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              placeholder={t('authCodePlaceholder')}
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
              className="rounded-md border border-brand-300 bg-white px-3 py-2 text-center text-lg tracking-widest text-brand-900"
            />
            <Pressable
              testID="login-verify-code"
              onPress={handleVerifyCode}
              disabled={verifyCode.isPending || code.length !== 6}
              className="items-center rounded-md bg-brand-700 px-3 py-2 disabled:opacity-50"
            >
              {verifyCode.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-sm font-medium text-white">{t('authLogin')}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
            >
              <Text className="text-center text-xs text-brand-600 underline">{t('authUseDifferentEmail')}</Text>
            </Pressable>
          </View>
        )}

        {error && <Text className="mt-3 text-sm text-red-600">{error}</Text>}
      </View>
    </View>
  );
}
