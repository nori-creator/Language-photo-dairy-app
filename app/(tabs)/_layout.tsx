import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/theme';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.secondaryLabel,
        headerStyle: { backgroundColor: colors.systemGroupedBackground },
        headerTitleStyle: { color: colors.label },
        tabBarStyle: { backgroundColor: colors.secondarySystemGroupedBackground },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '日記',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dex"
        options={{
          title: '図鑑',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
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
          tabBarIcon: ({ color, size }) => <Ionicons name="refresh-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '進捗',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
