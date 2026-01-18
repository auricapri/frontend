import { LocalizedText } from '../common';
import { Gender } from '../../constants/enums';

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  image_url?: string;
  icon?: string;  // Nome do ícone lucide (ex: "Shirt", "Watch", "Gem")
  gender: Gender; // Default: 'female'
  is_active: boolean;
  _associatedProductIds?: string[];
}
