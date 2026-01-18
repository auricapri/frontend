export interface MapboxContext {
  id: string;
  text: string;
  short_code?: string;
}

export interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: Record<string, unknown>;
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context: MapboxContext[];
}

export interface MapboxGeocodingResponse {
  type: string;
  query: unknown[];
  features: MapboxFeature[];
  attribution: string;
}

export interface MapboxMap {
  on(event: string, callback: (e: unknown) => void): void;
  resize(): void;
  flyTo(options: { center: [number, number]; zoom?: number; speed?: number; essential?: boolean }): void;
  remove(): void;
  addControl(control: unknown): void;
}

export interface MapboxMarker {
  setLngLat(coords: [number, number]): this;
  addTo(map: MapboxMap): this;
  remove(): this;
}

export interface MapboxGL {
  accessToken: string;
  Map: new (options: {
    container: HTMLElement | string;
    style: string;
    center: [number, number];
    zoom: number;
    attributionControl?: boolean;
    trackResize?: boolean;
  }) => MapboxMap;
  Marker: new (element?: HTMLElement) => MapboxMarker;
}
