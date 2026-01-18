#!/bin/bash
set -e

# Ensure we're in the correct directory
cd "${SRCROOT}/.." || exit

# Check if we're being called from Xcode (has required env vars)
if [ -z "$CONFIGURATION_BUILD_DIR" ] || [ -z "$UNLOCALIZED_RESOURCES_FOLDER_PATH" ]; then
  echo "warning: Not running in Xcode context, skipping bundling"
  exit 0
fi

WITH_ENVIRONMENT="node_modules/react-native/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="node_modules/react-native/scripts/react-native-xcode.sh"

# Check if files exist
if [ ! -f "$WITH_ENVIRONMENT" ]; then
  echo "error: $WITH_ENVIRONMENT not found" >&2
  exit 1
fi

if [ ! -f "$REACT_NATIVE_XCODE" ]; then
  echo "error: $REACT_NATIVE_XCODE not found" >&2
  exit 1
fi

# Generate CONFIG_JSON with proper structure that Metro expects
# This includes root and reactNativePath which are required
PROJECT_ROOT=$(pwd)
REACT_NATIVE_PATH="$PROJECT_ROOT/node_modules/react-native"
CONFIG_JSON=$(node -e "
const path = require('path');
const config = require('./react-native.config.js');
const fullConfig = {
  root: '$PROJECT_ROOT',
  reactNativePath: '$REACT_NATIVE_PATH',
  project: config.project || {ios: {}, android: {}},
  assets: config.assets || [],
  platforms: {
    ios: {sourceDir: './ios'},
    android: {sourceDir: './android'}
  }
};
console.log(JSON.stringify(fullConfig));
" 2>/dev/null || echo '{"root":"'$PROJECT_ROOT'","reactNativePath":"'$REACT_NATIVE_PATH'","project":{"ios":{},"android":{}},"assets":[],"platforms":{"ios":{"sourceDir":"./ios"},"android":{"sourceDir":"./android"}}}')
export CONFIG_JSON

# Always bundle - the React Native script will handle Debug vs Release logic
# For Debug on physical devices, it will bundle so the app can work offline
# The app can still connect to Metro for live reloading if available
/bin/sh -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE"

