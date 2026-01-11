let cachedVersion: string | null = null;

export async function getVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const response = await fetch('/VERSION');
    if (response.ok) {
      const version = (await response.text()).trim();
      cachedVersion = version;
      return version;
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
