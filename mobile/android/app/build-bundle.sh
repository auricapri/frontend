#!/bin/bash
cd "$(dirname "$0")/../.."
mkdir -p android/app/src/main/assets
npx metro build index.js --platform android --out android/app/src/main/assets/index.android.bundle --minify false
