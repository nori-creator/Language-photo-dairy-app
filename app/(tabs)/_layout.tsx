import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useColors } from '@/theme';

/** Translucent, blurred tab bar background — the iOS standard. */
function TabBarBackground() {
  const scheme = useColorScheme();
  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 80 : 100}
      tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.secondaryLabel,
        headerStyle: { backgroundColor: colors.systemGroupedBackground },
        headerTitleStyle: { color: colors.label, fontWeight: '700' },
        headerShadowVisible: false,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: {
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '日記',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dex"
        options={{
          title: '図鑑',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: '撮る',
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size + 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: '復習',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'refresh-circle' : 'refresh-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '進捗',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
