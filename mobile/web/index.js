/**
 * Web entry point for React Native Web
 */

import { AppRegistry } from 'react-native';
import App from '../App';
import { name as appName } from '../app.json';

// Mock react-native-splash-screen for web
if (typeof require !== 'undefined') {
  const SplashScreen = require('react-native-splash-screen');
  if (SplashScreen && SplashScreen.default) {
    SplashScreen.default.hide = () => {};
  }
}

// Mock react-native-fs for web
if (typeof require !== 'undefined') {
  try {
    const RNFS = require('react-native-fs');
    if (RNFS && RNFS.default) {
      RNFS.default.DocumentDirectoryPath = '/';
      RNFS.default.downloadFile = () => ({
        promise: Promise.resolve({ statusCode: 200 }),
      });
    }
  } catch (e) {
    // Ignore
  }
}

// Mock Firebase for web (will use web Firebase SDK if needed)
if (typeof require !== 'undefined') {
  try {
    const messaging = require('@react-native-firebase/messaging');
    if (messaging && messaging.default) {
      messaging.default.requestPermission = () => Promise.resolve(1);
      messaging.default.getToken = () => Promise.resolve('web-token');
      messaging.default.onMessage = () => () => {};
      messaging.default.onNotificationOpenedApp = () => {};
      messaging.default.getInitialNotification = () => Promise.resolve(null);
      messaging.default.deleteToken = () => Promise.resolve();
    }
  } catch (e) {
    // Ignore - Firebase will be handled differently on web
  }
}

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

