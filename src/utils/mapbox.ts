
/**
 * Mapbox utility configuration.
 * Provided by the user for the Auricapri project.
 */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export const getMapboxStyle = () => 'mapbox://styles/mapbox/light-v11';
