
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    category_id: 'cat_dresses',
    name: {
      en: 'Silk Charmeuse Maxi',
      pt: 'Maxi de Seda Charmeuse',
      es: 'Maxi de Seda Charmeuse',
      fr: 'Maxi en Soie Charmeuse'
    },
    description: {
      en: 'A fluid silhouette crafted from 100% pure silk charmeuse. Features a deep V-neckline and hand-finished hems.',
      pt: 'Uma silhueta fluida confeccionada em seda pura 100%. Possui decote em V profundo e acabamentos feitos à mão.',
      es: 'Una silueta fluida confeccionada en seda pura 100%. Con escote en V profundo y dobladillos terminados a mano.',
      fr: 'Une silhouette fluide en pure soie 100%. Col en V profond et finitions à la main.'
    },
    is_active: true,
    is_highlight: true,
    slug: {
      en: 'silk-charmeuse-maxi',
      pt: 'maxi-de-seda-charmeuse',
      es: 'maxi-de-seda-charmeuse',
      fr: 'maxi-en-soie-charmeuse'
    },
    base_images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=2083&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1800&auto=format&fit=crop'
    ],
    created_at: new Date().toISOString(),
    variants: [
      {
        id: 'v1',
        product_id: '1',
        sku: 'AUR-SLK-WHT-S',
        size: 'S',
        color_name: { en: 'Pearl White', pt: 'Branco Pérola', es: 'Blanco Perla', fr: 'Blanc Perle' },
        color_hex: '#F8F8F8',
        retail_price: 850,
        wholesale_price: 420,
        stock_quantity: 12,
        variant_images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=2083&auto=format&fit=crop'],
        is_active: true
      }
    ]
  },
  {
    id: '2',
    category_id: 'cat_outerwear',
    name: {
      en: 'Oversized Linen Blazer',
      pt: 'Blazer de Linho Oversized',
      es: 'Blazer de Lino Oversized',
      fr: 'Blazer en Lin Oversize'
    },
    description: {
      en: 'Breathable organic linen tailored for a relaxed yet powerful silhouette. Perfect for summer tailoring.',
      pt: 'Linho orgânico respirável cortado para uma silhueta relaxada, porém marcante. Perfeito para alfaiataria de verão.',
      es: 'Lino orgánico transpirable cortado para una silueta relajada pero potente. Perfecto para la sastrería de verano.',
      fr: 'Lin biologique respirant ajusté pour une silhouette décontractée mais puissante. Parfait pour le tailleur d\'été.'
    },
    is_active: true,
    is_highlight: true,
    slug: {
      en: 'oversized-linen-blazer',
      pt: 'blazer-de-linho-oversized',
      es: 'blazer-de-lino-oversized',
      fr: 'blazer-en-lin-oversize'
    },
    base_images: [
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1936&auto=format&fit=crop'
    ],
    created_at: new Date().toISOString(),
    variants: [
      {
        id: 'v2',
        product_id: '2',
        sku: 'AUR-LIN-BEG-M',
        size: 'M',
        color_name: { en: 'Sand Beige', pt: 'Bege Areia', es: 'Beige Arena', fr: 'Beige Sable' },
        color_hex: '#D2B48C',
        retail_price: 620,
        wholesale_price: 310,
        stock_quantity: 8,
        variant_images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1936&auto=format&fit=crop'],
        is_active: true
      }
    ]
  },
  {
    id: '3',
    category_id: 'cat_accessories',
    name: {
      en: 'Baroque Pearl Drops',
      pt: 'Brincos de Pérola Barroca',
      es: 'Pendientes de Perlas Barrocas',
      fr: 'Boucles d\'Oreilles Perles Baroques'
    },
    description: {
      en: 'Unique, hand-selected freshwater baroque pearls suspended from 18k gold vermeil hardware.',
      pt: 'Pérolas barrocas de água doce selecionadas à mão, suspensas em ferragens de prata com banho de ouro 18k.',
      es: 'Perlas barrocas de agua dulce únicas, seleccionadas a mano, suspendidas de herrajes de plata bañada en oro de 18 quilates.',
      fr: 'Perles baroques d\'eau douce uniques, sélectionnées à la main, suspendues à une monture en vermeil d\'or 18 carats.'
    },
    is_active: true,
    is_highlight: false,
    slug: {
      en: 'baroque-pearl-drops',
      pt: 'brincos-de-perola-barroca',
      es: 'pendientes-perlas-barrocas',
      fr: 'boucles-perles-baroques'
    },
    base_images: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop'
    ],
    created_at: new Date().toISOString(),
    variants: [
      {
        id: 'v3',
        product_id: '3',
        sku: 'AUR-PRL-GLD',
        size: 'Unique',
        color_name: { en: 'Gold/White', pt: 'Ouro/Branco', es: 'Oro/Blanco', fr: 'Or/Blanc' },
        color_hex: '#FFD700',
        retail_price: 240,
        wholesale_price: 110,
        stock_quantity: 25,
        variant_images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop'],
        is_active: true
      }
    ]
  }
];