import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { useAppTheme } from '@/constants/theme';

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <BrandLogo compact />,
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: theme.surface },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.red,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          headerRight: () => (
            <Pressable
              accessibilityLabel="What's New"
              accessibilityRole="button"
              hitSlop={6}
              onPress={() => router.push('/news')}
              style={({ pressed }) => ({
                alignItems: 'center',
                height: 44,
                justifyContent: 'center',
                opacity: pressed ? 0.55 : 1,
                width: 44,
              })}>
              <Ionicons name="megaphone-outline" color={theme.red} size={23} />
            </Pressable>
          ),
          headerRightContainerStyle: { paddingRight: 8 },
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: 'Following',
          tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
