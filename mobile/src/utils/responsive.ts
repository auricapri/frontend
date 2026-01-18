/**
 * Responsive Utilities
 * Provides functions to calculate responsive dimensions, fonts, and spacing
 * based on screen size to ensure the app works well on all device sizes
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13/14 - common reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Screen size breakpoints
export const SCREEN_SIZES = {
  SMALL: 360,   // Small phones
  MEDIUM: 390,  // Standard phones
  LARGE: 428,   // Large phones (iPhone Pro Max)
  XLARGE: 480,  // Very large phones
} as const;

/**
 * Get screen size category
 */
export const getScreenSize = (): 'small' | 'medium' | 'large' | 'xlarge' => {
  if (SCREEN_WIDTH < SCREEN_SIZES.SMALL) return 'small';
  if (SCREEN_WIDTH < SCREEN_SIZES.MEDIUM) return 'medium';
  if (SCREEN_WIDTH < SCREEN_SIZES.LARGE) return 'large';
  return 'xlarge';
};

/**
 * Calculate responsive width based on percentage
 * @param percentage - Percentage of screen width (0-100)
 * @returns Responsive width in pixels
 */
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Calculate responsive height based on percentage
 * @param percentage - Percentage of screen height (0-100)
 * @returns Responsive height in pixels
 */
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Scale font size based on screen width
 * @param size - Base font size
 * @param factor - Scale factor (default: 0.5 means scales 50% with screen width)
 * @returns Scaled font size
 */
export const scaleFont = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const scaledSize = size + (scale - 1) * size * factor;
  return Math.max(10, Math.round(scaledSize)); // Minimum 10px
};

/**
 * Scale dimension based on screen width
 * @param size - Base dimension
 * @param factor - Scale factor (default: 1.0 means scales fully with screen width)
 * @returns Scaled dimension
 */
export const scale = (size: number, factor: number = 1.0): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * (1 + (scale - 1) * factor));
};

/**
 * Get responsive padding
 * @param base - Base padding value
 * @returns Responsive padding
 */
export const rp = (base: number): number => {
  const scaleValue = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(base * (1 + (scaleValue - 1) * 0.3)); // Scale 30% with screen size
};

/**
 * Get responsive margin
 * @param base - Base margin value
 * @returns Responsive margin
 */
export const rm = (base: number): number => {
  const scaleValue = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(base * (1 + (scaleValue - 1) * 0.3));
};

/**
 * Get number of columns for grid based on screen size
 * @param small - Columns for small screens (default: 2)
 * @param medium - Columns for medium screens (default: 2)
 * @param large - Columns for large screens (default: 3)
 * @param xlarge - Columns for xlarge screens (default: 4)
 * @returns Number of columns
 */
export const getColumns = (
  small: number = 2,
  medium: number = 2,
  large: number = 3,
  xlarge: number = 4
): number => {
  const screenSize = getScreenSize();
  switch (screenSize) {
    case 'small':
      return small;
    case 'medium':
      return medium;
    case 'large':
      return large;
    case 'xlarge':
      return xlarge;
  }
};

/**
 * Get responsive drawer width
 * @param maxPercentage - Maximum percentage of screen width (default: 90)
 * @param minWidth - Minimum width in pixels (default: 300)
 * @param maxWidth - Maximum width in pixels (default: 450)
 * @returns Responsive drawer width
 */
export const getDrawerWidth = (
  maxPercentage: number = 90,
  minWidth: number = 300,
  maxWidth: number = 450
): number => {
  const percentageWidth = wp(maxPercentage);
  return Math.max(minWidth, Math.min(percentageWidth, maxWidth));
};

/**
 * Check if device is tablet (iPad, Android tablets)
 * Note: This is a simple check, may need refinement
 */
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (Platform.OS === 'ios' && SCREEN_WIDTH >= 768) ||
    (Platform.OS === 'android' && (SCREEN_WIDTH >= 600 || aspectRatio < 1.6))
  );
};

/**
 * Get safe area padding for navbar
 * Accounts for notch and status bar
 */
export const getNavbarPadding = (): { top: number; bottom: number } => {
  // iOS notch area is typically 44-50px
  // Android status bar is typically 24-48px
  const top = Platform.OS === 'ios' ? 44 : 24;
  return { top, bottom: 8 };
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };

