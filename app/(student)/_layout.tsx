import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui';
import { useTranslation } from '@/i18n';

export default function StudentLayout() {
  const { user, isInitialized, role } = useAuthStore();
  const t = useTranslation();

  if (!isInitialized) {
    return <Loading message={t.common.loading} />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'trainer') {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
