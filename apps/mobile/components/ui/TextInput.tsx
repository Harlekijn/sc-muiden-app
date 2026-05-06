import {
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { colors, radius, spacing, typography } from '@sc-muiden/shared';

interface Props extends TextInputProps {
  containerStyle?: ViewStyle;
  containerTestID?: string;
}

export function TextInput({ containerStyle, containerTestID, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[styles.container, focused && styles.containerFocused, containerStyle]}
      testID={containerTestID}
    >
      <RNTextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.text2}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: colors.navy12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  containerFocused: {
    borderColor: colors.blue,
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: 'Barlow_400Regular',
    fontSize: typography.scale.base,
    color: colors.text,
    minHeight: 44,
  },
});
