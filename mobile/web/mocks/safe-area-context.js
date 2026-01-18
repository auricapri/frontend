// Mock for react-native-safe-area-context on web
import React from 'react';
import { View } from 'react-native';

const SafeAreaInsetsContext = React.createContext({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const SafeAreaProvider = ({ children, ...props }) => {
  return React.createElement(View, { style: { flex: 1 }, ...props }, children);
};

export const SafeAreaView = ({ children, style, ...props }) => {
  const combinedStyle = style ? [{ flex: 1 }, style] : { flex: 1 };
  return React.createElement(View, { style: combinedStyle, ...props }, children);
};

export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export { SafeAreaInsetsContext };

