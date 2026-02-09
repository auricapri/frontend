import {
  Shirt, Watch, Gem, Glasses, ShoppingBag, Crown, Sparkles, Heart,
  Footprints, Gift, Flower2, Ribbon, type LucideIcon
} from 'lucide-react';

export const CATEGORY_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'Shirt', icon: Shirt, label: 'Roupas' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Bolsas' },
  { name: 'Watch', icon: Watch, label: 'Relógios' },
  { name: 'Gem', icon: Gem, label: 'Joias' },
  { name: 'Glasses', icon: Glasses, label: 'Óculos' },
  { name: 'Footprints', icon: Footprints, label: 'Calçados' },
  { name: 'Crown', icon: Crown, label: 'Acessórios' },
  { name: 'Sparkles', icon: Sparkles, label: 'Destaque' },
  { name: 'Heart', icon: Heart, label: 'Favoritos' },
  { name: 'Gift', icon: Gift, label: 'Presentes' },
  { name: 'Flower2', icon: Flower2, label: 'Flores' },
  { name: 'Ribbon', icon: Ribbon, label: 'Laços' },
];
