// Color family classification — maps any hex color to a named color family
// Used in the filter sidebar to group similar shades together
//
// Strategy: keyword match on color_name first (most reliable — uses supplier label),
// fall back to HSL analysis only when no name match is found.

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

// Keywords per family — iteration ORDER matters: more specific families must come before
// broader ones (e.g. marinho before azul, vinho before vermelho, lilas before roxo).
// The first family whose keyword is found in the color name wins.
const COLOR_FAMILY_KEYWORDS: Record<string, string[]> = {
  preto:    ['preto', 'preta', 'black', 'carvao', 'onix', 'ebano'],
  branco:   ['branco', 'branca', 'white', 'off white', 'offwhite', 'creme', 'cream', 'neve', 'marfim', 'perola', 'gelo'],
  cinza:    ['cinza', 'mescla', 'chumbo', 'grey', 'gray', 'prata', 'grafite', 'fume', 'pedra'],
  bege:     ['bege', 'nude', 'areia', 'palha', 'camel', 'sand', 'beige', 'natural', 'bone', 'aveia', 'linho', 'champagne'],
  marrom:   ['marrom', 'cafe', 'chocolate', 'terra', 'tabaco', 'brown', 'caramelo', 'amendoa', 'capuccino', 'canela', 'nozes'],
  vinho:    ['vinho', 'bordo', 'marsala', 'burgundy', 'oxigenio', 'bordeaux', 'ruby', 'rubi'],
  vermelho: ['vermelho', 'vermelha', 'red', 'tomate', 'scarlet', 'cereja', 'coral vermelho'],
  rosa:     ['rosa', 'pink', 'blush', 'flamingo', 'coral', 'quartzo', 'salmao', 'salmon', 'goiaba', 'ballet', 'rose', 'pitaya'],
  laranja:  ['laranja', 'orange', 'tangerina', 'abobora', 'cenoura', 'ferrugem'],
  amarelo:  ['amarelo', 'amarela', 'yellow', 'mostarda', 'ouro', 'dourado', 'dourada', 'gold', 'mel', 'limao', 'banana'],
  verde:    ['verde', 'green', 'militar', 'oliva', 'olive', 'musgo', 'menta', 'esmeralda', 'turquesa', 'tiffany', 'sage', 'floresta', 'aqua', 'pistache', 'kaki'],
  marinho:  ['marinho', 'navy', 'naval'],
  azul:     ['azul', 'blue', 'celeste', 'jeans', 'indigo', 'serenity', 'klein', 'bic', 'aco'],
  roxo:     ['roxo', 'lilas', 'purple', 'lavanda', 'lavender', 'violeta', 'uva', 'berinjela', 'ametista', 'orquidea'],
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractNameStr(colorName: unknown): string {
  if (!colorName) return '';
  if (typeof colorName === 'string') return colorName;
  if (typeof colorName === 'object' && colorName !== null) {
    const obj = colorName as Record<string, string>;
    return obj.pt || obj.en || obj.es || '';
  }
  return '';
}

function matchByName(nameStr: string): string | null {
  if (!nameStr) return null;
  const normalized = normalize(nameStr);
  for (const [familyId, keywords] of Object.entries(COLOR_FAMILY_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(normalize(kw))) {
        return familyId;
      }
    }
  }
  return null;
}

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

function classifyByHsl(hex: string): string {
  try {
    const [h, s, l] = hexToHsl(hex);

    if (l < 15) return 'preto';
    if (l > 85 && s < 20) return 'branco';
    if (s < 10) return 'cinza';

    if (h >= 15 && h <= 50 && l < 38 && s > 20) return 'marrom';
    if (h >= 20 && h <= 55 && l >= 55 && s < 45) return 'bege';

    if ((h < 20 || h > 330) && l < 35 && s > 25) return 'vinho';
    if (h < 15 || h > 345) return 'vermelho';

    if (h >= 300 && h <= 345) return 'rosa';
    if (h >= 280 && h < 300) return l > 60 ? 'rosa' : 'roxo';

    if (h >= 15 && h < 45) return 'laranja';
    if (h >= 45 && h < 70) return 'amarelo';
    if (h >= 70 && h < 200) return 'verde';
    if (h >= 200 && h < 265 && l < 30) return 'marinho';
    if (h >= 200 && h < 265) return 'azul';
    if (h >= 265 && h < 300) return 'roxo';

    return 'outro';
  } catch {
    return 'outro';
  }
}

// colorName accepts LocalizedText object or plain string
export function getColorFamilyId(hex: string, colorName?: unknown): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return 'outro';

  // 1. Try keyword match on color name — most reliable
  const nameStr = extractNameStr(colorName);
  const byName = matchByName(nameStr);
  if (byName) return byName;

  // 2. Fall back to HSL analysis
  return classifyByHsl(hex);
}
