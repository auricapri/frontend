let cachedVersion: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minuto

export async function getVersion(): Promise<string> {
  const now = Date.now();
  
  // Limpar cache se passou mais de 1 minuto
  if (cachedVersion && (now - cacheTimestamp) > CACHE_DURATION) {
    cachedVersion = null;
  }
  
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const response = await fetch(`/VERSION?t=${now}`);
    if (response.ok) {
      const version = (await response.text()).trim();
      cachedVersion = version;
      cacheTimestamp = now;
      return version;
    }
  } catch {
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
