import type { MapboxGL } from './types/common/mapbox';

export {};

declare global {
  interface Window {
    mapboxgl: MapboxGL;
  }

  // Common types used across the app that might be useful globally
  type LocalizedText = {
    en: string;
    pt: string;
    es?: string;
    fr?: string;
    [key: string]: string | undefined;
  };
}
