/**
 * @format
 */

// CRITICAL: Load URL polyfill FIRST, before any other imports
// This must be imported before Supabase or any other library that uses URL
import 'react-native-url-polyfill/auto';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

