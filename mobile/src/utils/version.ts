import { Platform } from 'react-native';

let cachedVersion: string | null = null;

export async function getVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    if (Platform.OS === 'web') {
      const response = await fetch('/VERSION');
      if (response.ok) {
        const version = (await response.text()).trim();
        cachedVersion = version;
        return version;
      }
    } else {
      try {
        const RNFS = require('react-native-fs');
        const versionPath = `${RNFS.DocumentDirectoryPath}/../VERSION`;
        const version = await RNFS.readFile(versionPath, 'utf8');
        const trimmed = version.trim();
        cachedVersion = trimmed;
        return trimmed;
      } catch (fsError) {
        try {
          const RNFS = require('react-native-fs');
          const bundlePath = `${RNFS.MainBundlePath}/VERSION`;
          const version = await RNFS.readFile(bundlePath, 'utf8');
          const trimmed = version.trim();
          cachedVersion = trimmed;
          return trimmed;
        } catch (bundleError) {
          console.warn('[Version] Failed to read VERSION file from filesystem');
        }
      }
    }
  } catch (error) {
    console.warn('[Version] Failed to read VERSION file, using default');
  }

  return 'unknown';
}

export function getVersionSync(): string {
  if (cachedVersion) {
    return cachedVersion;
  }
  return 'unknown';
}
