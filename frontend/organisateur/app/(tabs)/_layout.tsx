import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme, ColorSchemeName } from 'react-native';

import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  readonly name: React.ComponentProps<typeof FontAwesome>['name'];
  readonly color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function CalendarIcon({ color }: { readonly color: string }) {
  return <TabBarIcon name="calendar" color={color} />;
}

function UserIcon({ color }: { readonly color: string }) {
  return <TabBarIcon name="user" color={color} />;
}

function HeaderRight({ colorScheme }: { readonly colorScheme: ColorSchemeName }) {
  return (
    <Link href="/modal" asChild>
      <Pressable>
        {({ pressed }) => (
          <FontAwesome
            name="info-circle"
            size={25}
            color={Colors[colorScheme ?? 'light'].text}
            style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
          />
        )}
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Créer la fonction headerRight en dehors des options
  const getHeaderRight = React.useCallback(() => {
    return <HeaderRight colorScheme={colorScheme} />;
  }, [colorScheme]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mes soirées',
          tabBarIcon: CalendarIcon,
          headerRight: getHeaderRight,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Profil',
          tabBarIcon: UserIcon,
        }}
      />
    </Tabs>
  );
}
