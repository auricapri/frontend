/**
 * Input Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          inputStyle,
          style,
        ]}
        placeholderTextColor="#737373"
        {...props}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 24,
    fontSize: 14,
    color: '#000000',
  },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

