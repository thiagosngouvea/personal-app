import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui';

export default function AppLayout() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <Loading message="Loading..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="client" />
      <Stack.Screen name="evaluation" />
    </Stack>
  );
}
