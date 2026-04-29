import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@sc-muiden/shared';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'label' | 'caption' | 'score';

interface Props extends TextProps {
  variant?: TextVariant;
}

export function Text({ variant = 'body', style, ...props }: Props) {
  return <RNText style={[styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: typography.scale['4xl'],
    color: colors.text,
    lineHeight: typography.scale['4xl'] * 1.1,
  },
  h2: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: typography.scale['3xl'],
    color: colors.text,
    lineHeight: typography.scale['3xl'] * 1.15,
  },
  h3: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: typography.scale['2xl'],
    color: colors.text,
    lineHeight: typography.scale['2xl'] * 1.2,
  },
  h4: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: typography.scale.lg,
    color: colors.text,
    lineHeight: typography.scale.lg * 1.3,
  },
  body: {
    fontFamily: 'Barlow_400Regular',
    fontSize: typography.scale.base,
    color: colors.text,
    lineHeight: typography.scale.base * 1.5,
  },
  label: {
    fontFamily: 'Barlow_500Medium',
    fontSize: typography.scale.sm,
    color: colors.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: 'Barlow_400Regular',
    fontSize: typography.scale.xs,
    color: colors.text2,
    lineHeight: typography.scale.xs * 1.4,
  },
  score: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: typography.scale['5xl'],
    color: colors.text,
    lineHeight: typography.scale['5xl'],
  },
});
