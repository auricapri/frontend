let mapboxPromise: Promise<any> | null = null;

/**
 * Dynamically loads Mapbox GL JS and CSS on demand.
 * Returns a singleton promise so it only loads once.
 */
export function loadMapbox(): Promise<any> {
  if (mapboxPromise) return mapboxPromise;

  const win = window as any;
  if (win.mapboxgl) {
    mapboxPromise = Promise.resolve(win.mapboxgl);
    return mapboxPromise;
  }

  mapboxPromise = new Promise((resolve, reject) => {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (win.mapboxgl) {
        resolve(win.mapboxgl);
      } else {
        reject(new Error('Mapbox GL JS failed to initialize'));
      }
    };
    script.onerror = () => {
      mapboxPromise = null;
      reject(new Error('Failed to load Mapbox GL JS'));
    };
    document.head.appendChild(script);
  });

  return mapboxPromise;
}
