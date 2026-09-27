import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="manga/[id]" />
      <Stack.Screen name="chapter/[id]" />
    </Stack>
  );
}
