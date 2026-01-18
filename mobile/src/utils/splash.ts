import SplashScreen from 'react-native-splash-screen';

/**
 * Utility to manage splash screen visibility
 * Replicates the web splash screen behavior
 */
export const hideSplash = () => {
  try {
    SplashScreen.hide();
  } catch (e) {
    // Ignore errors (e.g., on web)
    console.log('Splash screen hide called');
  }
};

export const showSplash = () => {
  // Note: react-native-splash-screen doesn't support showing again
  // This is mainly for consistency with web API
};
