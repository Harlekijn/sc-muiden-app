import { Pressable, View, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../ui/Text';

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  mapLink?: string;
}

export function InfoRow({ icon: Icon, label, mapLink }: InfoRowProps) {
  const handlePress = mapLink
    ? () => Linking.openURL(`maps:?q=${encodeURIComponent(label)}`)
    : undefined;

  const content = (
    <View style={styles.row}>
      <Icon size={20} color={colors.blue} />
      <Text variant="body" style={[styles.label, mapLink && styles.link]}>
        {label}
      </Text>
    </View>
  );

  if (handlePress) {
    return (
      <Pressable onPress={handlePress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

export function InfoSection({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    marginTop: -10,
  },
  pressable: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mid,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  label: {
    color: colors.text,
    flex: 1,
  },
  link: {
    color: colors.blue,
    textDecorationLine: 'underline',
  },
});
