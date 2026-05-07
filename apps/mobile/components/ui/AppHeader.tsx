import { View, StyleSheet, Platform, StatusBar, Pressable } from 'react-native';
import { Bell, Settings } from 'lucide-react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Logo } from './Logo';

const ANDROID_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

interface AppHeaderProps {
  onBell?: () => void;
  onSettings?: () => void;
}

export function AppHeader({ onBell, onSettings }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Logo height={44} />
      <View style={styles.actions}>
        <Pressable
          style={styles.iconBtn}
          onPress={onBell}
          accessibilityRole="button"
          accessibilityLabel="Meldingen"
        >
          <Bell size={18} color={colors.white} strokeWidth={1.5} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Instellingen"
        >
          <Settings size={18} color={colors.white} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[5],
    paddingTop: ANDROID_TOP + spacing[3],
    paddingBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
