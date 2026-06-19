import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/store/AppStore';
import { useColors } from '@/theme';

export default function RootLayout() {
  const colors = useColors();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerLargeTitle: true,
            headerTransparent: false,
            contentStyle: { backgroundColor: colors.systemGroupedBackground },
            headerStyle: { backgroundColor: colors.systemGroupedBackground },
            headerTintColor: colors.blue,
            headerTitleStyle: { color: colors.label },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="card/[id]" options={{ title: 'カード', presentation: 'card' }} />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
