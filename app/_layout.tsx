import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from '@/store/AppStore';
import { useColors } from '@/theme';

function RootNavigator() {
  const colors = useColors();
  const { session, loading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  // Gate: send logged-out users to /login, logged-in users into the app.
  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === 'login';
    if (!session && !onLogin) router.replace('/login');
    else if (session && onLogin) router.replace('/(tabs)');
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.systemGroupedBackground }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        contentStyle: { backgroundColor: colors.systemGroupedBackground },
        headerStyle: { backgroundColor: colors.systemGroupedBackground },
        headerTintColor: colors.blue,
        headerTitleStyle: { color: colors.label },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="card/[id]" options={{ title: 'カード', presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
