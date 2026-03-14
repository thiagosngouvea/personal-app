import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui';

export default function Index() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <Loading message="Loading..." />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
