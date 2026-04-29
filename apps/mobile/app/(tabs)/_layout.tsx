import { Tabs } from 'expo-router';
import { Calendar, Home, Newspaper, User, Users } from 'lucide-react-native';
import { colors } from '@sc-muiden/shared';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navy,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.navy40,
        tabBarLabelStyle: {
          fontFamily: 'Barlow_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Thuis',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="nieuws"
        options={{
          title: 'Nieuws',
          tabBarIcon: ({ color, size }) => (
            <Newspaper size={size} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="profiel"
        options={{
          title: 'Profiel',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}
