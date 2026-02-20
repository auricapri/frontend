// Color family classification — maps any hex color to a named color family
// Used in the filter sidebar to group similar shades together

export interface ColorFamily {
  id: string;
  label: string;
  hex: string; // representative display color
}

export const COLOR_FAMILIES: ColorFamily[] = [
  { id: 'preto',    label: 'Preto',    hex: '#1c1c1c' },
  { id: 'branco',   label: 'Branco',   hex: '#f0efeb' },
  { id: 'cinza',    label: 'Cinza',    hex: '#808080' },
  { id: 'bege',     label: 'Bege',     hex: '#c9a87c' },
  { id: 'marrom',   label: 'Marrom',   hex: '#7c4a2a' },
  { id: 'vinho',    label: 'Vinho',    hex: '#6d1b2b' },
  { id: 'vermelho', label: 'Vermelho', hex: '#cc2222' },
  { id: 'rosa',     label: 'Rosa',     hex: '#e8709a' },
  { id: 'laranja',  label: 'Laranja',  hex: '#e06020' },
  { id: 'amarelo',  label: 'Amarelo',  hex: '#e0b820' },
  { id: 'verde',    label: 'Verde',    hex: '#2a8c40' },
  { id: 'marinho',  label: 'Marinho',  hex: '#1a2a5e' },
  { id: 'azul',     label: 'Azul',     hex: '#2563b0' },
  { id: 'roxo',     label: 'Roxo',     hex: '#7c3aad' },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return [h * 360, s * 100, l * 100];
}

export function getColorFamilyId(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return 'outro';

  try {
    const [h, s, l] = hexToHsl(hex);

    // Achromatics (by lightness + saturation)
    if (l < 15) return 'preto';
    if (l > 85 && s < 25) return 'branco';
    if (s < 15) return 'cinza';

    // Brown: warm dark-medium tones
    if (h >= 15 && h <= 50 && l < 38 && s > 20) return 'marrom';

    // Beige/Nude: warm, light, desaturated-medium
    if (h >= 20 && h <= 55 && l >= 55 && s < 50) return 'bege';

    // Wine: red hue, dark + saturated
    if ((h < 20 || h > 330) && l < 35 && s > 25) return 'vinho';

    // Red (hue wraps around 0°/360°)
    if (h < 15 || h > 345) return 'vermelho';

    // Pink: 300–345° (bright/light reds/magentas)
    if (h >= 300 && h <= 345) return 'rosa';

    // Purple-pink boundary 280–300: light → rosa, dark → roxo
    if (h >= 280 && h < 300) return l > 60 ? 'rosa' : 'roxo';

    // Orange
    if (h >= 15 && h < 45) return 'laranja';

    // Yellow
    if (h >= 45 && h < 70) return 'amarelo';

    // Green (includes teal/turquoise)
    if (h >= 70 && h < 200) return 'verde';

    // Navy: dark blue
    if (h >= 200 && h < 265 && l < 30) return 'marinho';

    // Blue
    if (h >= 200 && h < 265) return 'azul';

    // Purple/Lilac
    if (h >= 265 && h < 300) return 'roxo';

    return 'outro';
  } catch {
    return 'outro';
  }
}
