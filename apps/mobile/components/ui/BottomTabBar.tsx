import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Calendar, Home, Store, User } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from './Text';

interface LucideIconProps {
  size: number;
  color: string;
  strokeWidth: number;
}

interface TabDef {
  name: string;
  label: string;
  href: string;
  Icon: ComponentType<LucideIconProps>;
}

const TABS: TabDef[] = [
  { name: 'index', label: 'Home', href: '/(tabs)', Icon: Home },
  { name: 'agenda', label: 'Agenda', href: '/(tabs)/agenda', Icon: Calendar },
  { name: 'club', label: 'Club', href: '/(tabs)/club', Icon: Store },
  { name: 'profiel', label: 'Profiel', href: '/(tabs)/profiel', Icon: User },
];

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map(({ name, label, href, Icon }) => {
        const focused = pathname === '/' ? name === 'index' : pathname.includes(name === 'index' ? '/(tabs)' : name);
        const color = focused ? colors.blue : 'rgba(255,255,255,0.40)';

        return (
          <Pressable
            key={name}
            style={styles.tab}
            onPress={() => router.push(href as Parameters<typeof router.push>[0])}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <View style={[styles.dot, focused && styles.dotActive]} />
            <Icon size={24} color={color} strokeWidth={1.5} />
            <Text variant="caption" style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    height: 80 + (Platform.OS === 'ios' ? 0 : 0),
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.blue,
  },
  label: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 10,
    marginTop: 2,
  },
});
