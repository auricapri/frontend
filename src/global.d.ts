export {};

declare global {
  interface Window {
    mapboxgl: any; // allow: We can improve this if we want to type the whole library
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
