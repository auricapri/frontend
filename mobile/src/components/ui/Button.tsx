/**
 * Button Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onPress,
  children,
  style,
}) => {
  const baseStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    opacity: disabled || isLoading ? 0.5 : 1,
    borderRadius: 16,
  };

  const variantStyles: Record<typeof variant, ViewStyle> = {
    primary: {
      backgroundColor: '#000000',
    },
    secondary: {
      backgroundColor: '#F5F5F5',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#000000',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  const sizeStyles: Record<typeof size, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
    sm: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 12 },
    md: { paddingHorizontal: 24, paddingVertical: 12, fontSize: 14 },
    lg: { paddingHorizontal: 32, paddingVertical: 16, fontSize: 16 },
  };

  return (
    <TouchableOpacity
      style={[
        baseStyle,
        variantStyles[variant],
        { paddingHorizontal: sizeStyles[size].paddingHorizontal, paddingVertical: sizeStyles[size].paddingVertical },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : '#000000'} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeStyles[size].fontSize,
              color: variant === 'primary' ? '#FFFFFF' : variant === 'outline' ? '#000000' : '#000000',
            },
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

