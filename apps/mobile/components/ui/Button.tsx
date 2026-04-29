import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@sc-muiden/shared';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: string;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], styles[size], (disabled || loading) && styles.disabled, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.blue : colors.white} size="small" />
      ) : (
        <Text
          variant="label"
          style={[styles.labelBase, styles[`${variant}Label`]]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.navy,
  },
  secondary: {
    backgroundColor: colors.blue,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.blue,
  },
  sm: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    minHeight: 52,
  },
  disabled: {
    opacity: 0.4,
  },
  labelBase: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  primaryLabel: {
    color: colors.white,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: typography.scale.base,
  },
  secondaryLabel: {
    color: colors.white,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: typography.scale.base,
  },
  ghostLabel: {
    color: colors.blue,
    fontFamily: 'Barlow_600SemiBold',
    fontSize: typography.scale.base,
  },
});
