import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/i18n';
import { Loading } from '@/components/ui';

export default function Index() {
  const { user, isInitialized } = useAuthStore();
  const t = useTranslation();

  if (!isInitialized) {
    return <Loading message={t.common.loading} />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
