import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Home, Store, User } from 'lucide-react-native';
import { colors } from '@sc-muiden/shared';
import type { ComponentType } from 'react';

interface LucideIconProps {
  size: number;
  color: string;
  strokeWidth: number;
}

function makeTabIcon(Icon: ComponentType<LucideIconProps>) {
  return function TabIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: focused ? colors.blue : 'transparent',
            marginBottom: 4,
          }}
        />
        <Icon size={size} color={color} strokeWidth={1.5} />
      </View>
    );
  };
}

export default function TabLayout() {
  return (
    <>
    <StatusBar style="light" backgroundColor={colors.navy} />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navy,
          borderTopWidth: 0,
          height: 80,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.40)',
        tabBarLabelStyle: {
          fontFamily: 'Barlow_500Medium',
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: makeTabIcon(Home),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: makeTabIcon(Calendar),
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          title: 'Club',
          tabBarIcon: makeTabIcon(Store),
        }}
      />
      <Tabs.Screen
        name="profiel"
        options={{
          title: 'Profiel',
          tabBarIcon: makeTabIcon(User),
        }}
      />
      <Tabs.Screen name="teams" options={{ href: null }} />
      <Tabs.Screen name="nieuws" options={{ href: null }} />
    </Tabs>
    </>
  );
}
