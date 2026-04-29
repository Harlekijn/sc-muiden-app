import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, radius, shadows } from '@sc-muiden/shared';
import { ReactNode } from 'react';

type CardVariant = 'default' | 'subtle' | 'elevated';

interface CardProps {
  variant?: CardVariant;
  onPress?: TouchableOpacityProps['onPress'];
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ variant = 'default', onPress, children, style }: CardProps) {
  const cardStyle = [styles.base, styles[variant], style];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
  },
  default: {
    ...shadows.card.rn,
  },
  subtle: {
    borderWidth: 1,
    borderColor: colors.mid,
  },
  elevated: {
    ...shadows.elevated.rn,
  },
});
